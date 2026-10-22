import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  Int,
  Parent,
  ResolveField,
} from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  GqlAdminGuard,
  GqlAuthAccessGuard,
} from "src/commons/auth/gql-auth.guard";
import { Cache } from "cache-manager";
import { Board } from "src/boards/entities/board.entity";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import {
  consumeEmailVerification,
  isAsciiEmail,
  isEmailVerified,
} from "src/commons/auth/email-verification";
import { revokeUserTokens } from "src/commons/auth/token.utils";
import {
  isOwner,
  maskEmail,
  resolveViewer,
  setViewer,
} from "src/commons/auth/viewer";
import { AuthUser, IContext } from "src/commons/type/context";
import { hashPassword } from "src/commons/utils/password";

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService, //
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  @Mutation(() => User)
  async createUser(
    @Args("createUserInput") createUserInput: CreateUserInput,
    @Context() context: IContext
  ) {
    // DB collation이 악센트·대소문자를 무시하므로 비ASCII 이메일은 다른 주소와 같은 행으로 취급될 수 있다
    if (!isAsciiEmail(createUserInput.email))
      throw new UnprocessableEntityException(
        "이메일 형식이 올바르지 않습니다."
      );

    // sendSignupEmailToken(또는 sendEmailToken) → checkEmailToken을 통과한 이메일만 가입시킨다
    if (!(await isEmailVerified(this.cacheManager, createUserInput.email)))
      throw new ForbiddenException("이메일 인증이 필요합니다.");

    const hashedPassword = await hashPassword(createUserInput.password);

    const result = await this.usersService.create({
      createUserInput,
      password: hashedPassword,
    });

    // 인증은 1회용: 가입이 성공한 뒤에만 지운다 (닉네임 중복 등으로 실패하면 재인증 없이 다시 시도할 수 있다)
    await consumeEmailVerification(this.cacheManager, createUserInput.email);

    // 가입 응답에서는 방금 만든 계정을 본인으로 보고 email·point를 원래 값으로 돌려준다
    setViewer(context, {
      id: result.id,
      email: result.email,
      nickname: result.nickname,
    });

    return result;
  }

  @Query(() => [User])
  fetchUsers(
    @Args("page", { defaultValue: 1 }) page: number //
  ) {
    return this.usersService.findAll({ page });
  }

  // 로그아웃·무효화 여부는 GqlAuthAccessGuard(accessToken:<t> 블랙리스트, 유저 단위 무효화)가 확인한다
  @UseGuards(GqlAuthAccessGuard)
  @Query(() => User)
  fetchLoginedUser(
    @CurrentUser() user: AuthUser //
  ) {
    return this.usersService.findOneByUserId({ userId: user.id });
  }

  // 유저 email로 유저 찾기
  @Query(() => User)
  fetchUserWithEmail(@Args("email", { type: () => String }) email: string) {
    return this.usersService.findOneByEmail({ email });
  }

  // 유저 id로 유저 찾기
  @Query(() => User)
  fetchUserWithUserId(@Args("userId", { type: () => String }) userId: string) {
    return this.usersService.findOneByUserId({ userId });
  }

  @Query(() => User)
  fetchUserWithNickname(
    @Args("nickname", { type: () => String }) nickname: string //
  ) {
    return this.usersService.findOneByNickname({ nickname });
  }

  @Query(() => [Board])
  async fetchProjectsOfUser(
    @Args("userId", { type: () => String }) userId: string //
  ) {
    await this.assertUserExists(userId);
    return this.usersService.findBoards({ userId });
  }

  //유저가 현재 진행하고 있는 프로젝트 찾기
  @Query(() => Board)
  async fetchProjectOfUser(
    @Args("userId", { type: () => String }) userId: string //
  ) {
    await this.assertUserExists(userId);

    const board = await this.usersService.findBoard({ userId });
    if (!board) {
      throw new Error("유저가 진행중인 프로젝트가 없습니다.");
    }
    return board;
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => User)
  updateUser(
    @CurrentUser() user: AuthUser,
    @Args("updateUserInput") updateUserInput: UpdateUserInput
  ) {
    return this.usersService.update({ userId: user.id, updateUserInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async removeUser(
    @CurrentUser() user: AuthUser //
  ) {
    const result = await this.usersService.remove({ userId: user.id });

    // 탈퇴 전에 발급된 access/refresh 토큰을 모두 무효화한다
    await revokeUserTokens(this.cacheManager, user.id);

    return result;
  }

  // 탈퇴한 유저 복구는 운영자만 (ADMIN_USER_IDS)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Boolean)
  restoreUser(
    @Args("userId", { type: () => String }) userId: string //
  ) {
    return this.usersService.restore({ userId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async updatePassword(
    @CurrentUser() user: AuthUser,
    @Args("password", { type: () => String }) password: string
  ) {
    // sendPasswordEmailToken → checkEmailToken으로 인증한 경우에만 바꾼다
    // (user.email은 로그인 때 DB에서 읽은 주소다)
    if (!(await isEmailVerified(this.cacheManager, user.email)))
      throw new ForbiddenException("이메일 인증이 필요합니다.");

    // 해싱은 usersService.updatePassword에서 한 번만 한다
    await this.usersService.updatePassword({
      email: user.email,
      password,
    });

    await consumeEmailVerification(this.cacheManager, user.email);

    // 현재 기기를 포함해 변경 전에 발급된 모든 세션을 끊는다 (프론트는 로그인 화면으로 보내야 한다)
    await revokeUserTokens(this.cacheManager, user.id);

    return true;
  }

  @Query(() => User)
  async fetchUserRandom() {
    return this.usersService.fetchUserRandom();
  }

  @Mutation(() => Boolean)
  async checkEmailDuplicate(
    @Args("email", { type: () => String }) email: string //
  ) {
    return this.usersService.checkEmailDuplicate({ email });
  }

  // 이메일은 본인에게만 원문으로, 다른 사람에게는 가려서 준다 (User가 중첩된 모든 경로에 적용된다)
  @ResolveField(() => String)
  async email(
    @Parent() user: { id: string; email: string },
    @Context() context: IContext
  ) {
    if (!user?.email) return user?.email; // 값이 없을 때의 기존 동작 유지
    const viewer = await resolveViewer(
      context,
      this.jwtService,
      this.cacheManager
    );
    return isOwner(viewer, user) ? user.email : maskEmail(user.email);
  }

  // 포인트(결제로 충전한 잔액)는 본인에게만 실제 값, 다른 사람에게는 0
  @ResolveField(() => Int)
  async point(
    @Parent() user: { id: string; point: number },
    @Context() context: IContext
  ) {
    const viewer = await resolveViewer(
      context,
      this.jwtService,
      this.cacheManager
    );
    return isOwner(viewer, user) ? user.point : 0;
  }

  private async assertUserExists(userId: string) {
    const user = await this.usersService.findOneByUserId({ userId });
    if (!user) {
      throw new Error("유저가 존재하지 않습니다.");
    }
  }
}
