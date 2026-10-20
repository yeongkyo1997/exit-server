import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import * as bcrypt from "bcrypt";
import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { Cache } from "cache-manager";
import { Board } from "src/boards/entities/board.entity";
import { EmailService } from "src/email/email.service";
import { emailVerifiedKey } from "src/email/email-verified";

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService, //
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache, //
    private readonly emailService: EmailService
  ) {}

  @Mutation(() => User)
  async createUser(@Args("createUserInput") createUserInput: CreateUserInput) {
    // checkEmailToken으로 이메일 인증을 마친 경우에만 가입할 수 있다
    if (!(await this.cacheManager.get(emailVerifiedKey(createUserInput.email))))
      throw new UnauthorizedException("이메일 인증이 필요합니다.");

    const password = createUserInput.password;

    const hashedPassword = await bcrypt.hash(password, 10.2);

    const result = await this.usersService.create({
      createUserInput,
      password: hashedPassword,
    });

    // redis에서 이메일 토큰과 인증 표시 삭제하기
    await this.cacheManager.del(createUserInput.email);
    await this.cacheManager.del(emailVerifiedKey(createUserInput.email));

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
    @Context() context: any //
  ) {
    const validToken = context.req.headers["authorization"].split(" ")[1];
    // redis에서 로그아웃 상태확인하기
    if (await this.cacheManager.get(validToken)) {
      throw new UnauthorizedException("로그인하지 않았습니다.");
    }
    const userId = context.req.user.id;
    const result = await this.usersService.findOne({ userId });

    return result;
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
    const user = await this.usersService.findOneByUserId({ userId });
    if (!user) {
      throw new Error("유저가 존재하지 않습니다.");
    }
    const boards = await this.usersService.findBoards({ userId });
    if (!boards) {
      throw new Error("유저와 관련된 프로젝트가 없습니다.");
    }
    return boards;
  }

  //유저가 현재 진행하고 있는 프로젝트 찾기
  @Query(() => Board)
  async fetchProjectOfUser(
    @Args("userId", { type: () => String }) userId: string //
  ) {
    const user = await this.usersService.findOneByUserId({ userId });
    if (!user) {
      throw new Error("유저가 존재하지 않습니다.");
    }

    const board = await this.usersService.findBoard({ userId });
    if (!board) {
      throw new Error("유저가 진행중인 프로젝트가 없습니다.");
    }
    return board;
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => User)
  updateUser(
    @Context() context: any,
    @Args("updateUserInput") updateUserInput: UpdateUserInput
  ) {
    const userId = context.req.user.id;
    return this.usersService.update({ userId, updateUserInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async removeUser(
    @Context() context: any //
  ) {
    const userId = context.req.user.id;
    return this.usersService.remove({ userId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  restoreUser(
    @Context() context: any,
    @Args("userId", { type: () => String }) userId: string //
  ) {
    // 본인 계정만 복구할 수 있다
    if (userId !== context.req.user.id)
      throw new ForbiddenException("본인 계정만 복구할 수 있습니다.");
    return this.usersService.restore({ userId });
  }

  // 비밀번호 변경을 위한 이메일 토큰 생성
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async sendPasswordEmailToken(
    @Context() context: any //
  ) {
    const user = context.req.user;
    // 이메일 토큰 생성하기 문자 6자리
    const emailToken = Math.random().toString(36).substring(2, 8);

    // 3분동안 유효한 이메일 토큰 생성
    await this.cacheManager.set(user.email, emailToken, { ttl: 180 });

    // 이메일 토큰 전송하기
    await this.emailService.sendEmail({
      email: user.email,
      emailToken,
      changePassword: true,
    });
    return true;
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async updatePassword(
    @Context() context: any,
    @Args("password", { type: () => String }) password: string
  ) {
    const user = context.req.user;

    // sendPasswordEmailToken -> checkEmailToken으로 인증한 경우에만 변경할 수 있다
    if (!(await this.cacheManager.get(emailVerifiedKey(user.email))))
      throw new UnauthorizedException("이메일 인증이 필요합니다.");

    // 해싱은 usersService.updatePassword에서 한 번만 한다
    await this.usersService.updatePassword({
      email: user.email,
      password,
    });

    // redis에서 이메일 토큰과 인증 표시 삭제하기
    await this.cacheManager.del(user.email);
    await this.cacheManager.del(emailVerifiedKey(user.email));

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
    const result = await this.usersService.checkEmailDuplicate({ email });
    return result;
  }
}
