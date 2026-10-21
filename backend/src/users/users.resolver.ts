import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import {
  CACHE_MANAGER,
  Inject,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { Cache } from "cache-manager";
import { Board } from "src/boards/entities/board.entity";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { bearerToken } from "src/commons/auth/token.utils";
import { AuthUser, IContext } from "src/commons/type/context";
import { hashPassword } from "src/commons/utils/password";

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService, //
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  @Mutation(() => User)
  async createUser(@Args("createUserInput") createUserInput: CreateUserInput) {
    const hashedPassword = await hashPassword(createUserInput.password);

    const result = await this.usersService.create({
      createUserInput,
      password: hashedPassword,
    });

    // redis에서 이메일 토큰 삭제하기
    await this.cacheManager.del(createUserInput.email);

    return result;
  }

  @Query(() => [User])
  fetchUsers(
    @Args("page", { defaultValue: 1 }) page: number //
  ) {
    return this.usersService.findAll({ page });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => User)
  async fetchLoginedUser(
    @Context() context: IContext //
  ) {
    const validToken = bearerToken(context.req.headers["authorization"]);
    // redis에서 로그아웃 상태확인하기
    // (접두사 없는 원시 토큰 키다. 무인증 mutation도 같은 키를 쓸 수 있으므로 지우면 동작이 바뀐다)
    if (await this.cacheManager.get(validToken)) {
      throw new UnauthorizedException("로그인하지 않았습니다.");
    }
    return this.usersService.findOneByUserId({ userId: context.req.user.id });
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
    return this.usersService.remove({ userId: user.id });
  }

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
    // 기존 동작 유지: usersService.updatePassword에서 한 번 더 해싱한다
    const hashedPassword = await hashPassword(password);

    await this.usersService.updatePassword({
      email: user.email,
      password: hashedPassword,
    });

    // redis에서 이메일 토큰 삭제하기
    await this.cacheManager.del(user.email);

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

  private async assertUserExists(userId: string) {
    const user = await this.usersService.findOneByUserId({ userId });
    if (!user) {
      throw new Error("유저가 존재하지 않습니다.");
    }
  }
}
