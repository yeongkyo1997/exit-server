import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import * as bcrypt from "bcrypt";
import {
  CACHE_MANAGER,
  Inject,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { Cache } from "cache-manager";

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService, //
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache //
  ) {}

  @Mutation(() => User)
  async createUser(
    @Args("createUserInput") createUserInput: CreateUserInput,
    @Args("emailToken") emailToken: string
  ) {
    // 이메일 토큰 확인하기
    const validToken = await this.cacheManager.get(createUserInput.email);
    if (validToken !== emailToken)
      throw new UnauthorizedException("이메일 인증번호를 확인해주세요.");

    const password = createUserInput.password;

    const hashedPassword = await bcrypt.hash(password, 10.2);

    const result = await this.usersService.create({
      createUserInput,
      password: hashedPassword,
    });

    // redis에서 이메일 토큰 삭제하기
    await this.cacheManager.del(createUserInput.email);

    return result;
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [User])
  fetchUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => User)
  async fetchUser(
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

  @Mutation(() => Boolean)
  restoreUser(
    @Args("userId", { type: () => String }) userId: string //
  ) {
    return this.usersService.restore({ userId });
  }

  // 비밀번호 변경을 위한 이메일 토큰 생성
  @Mutation(() => Boolean)
  async createEmailTokenForPassword(
    @Args("email", { type: () => String }) email: string
  ) {
    // 이메일 토큰 생성하기 문자 6자리
    const emailToken = Math.random().toString(36).substring(2, 8);

    // 5분동안 유효한 이메일 토큰 생성
    await this.cacheManager.set(email, emailToken, { ttl: 300 });

    // 이메일 토큰 전송하기
    await this.usersService.isRegisteredEmail({ email, emailToken });
    return true;
  }

  @Mutation(() => Boolean)
  async updatePassword(
    @Args("email", { type: () => String }) email: string,
    @Args("password", { type: () => String }) password: string,
    @Args("emailToken") emailToken: string
  ) {
    // 이메일 토큰 확인하기
    const validToken = await this.cacheManager.get(email);
    if (validToken !== emailToken)
      throw new UnauthorizedException("이메일 인증번호를 확인해주세요.");

    const hashedPassword = await bcrypt.hash(password, 10.2);

    await this.usersService.updatePassword({ email, password: hashedPassword });

    // redis에서 이메일 토큰 삭제하기
    await this.cacheManager.del(email);

    return true;
  }
  @Query(() => User)
  async fetchUserRandom() {
    return this.usersService.fetchUserRandom();
  }
}
