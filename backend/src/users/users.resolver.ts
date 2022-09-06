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

    const { password } = createUserInput;

    const hashedPassword = await bcrypt.hash(password, 10.2);

    const result = this.usersService.create({
      createUserInput,
      password: hashedPassword,
    });

    // redis에서 이메일 토큰 삭제하기
    await this.cacheManager.del(createUserInput.email);

    return result;
  }

  @Query(() => [User])
  fetchUsers() {
    return this.usersService.findAll();
  }

  // 유저 email로 유저 찾기
  @Query(() => User)
  fetchUserWithEmail(@Args("email", { type: () => String }) email: string) {
    return this.usersService.findOneWithEmail({ email });
  }

  // 유저 id로 유저 찾기
  @Query(() => User)
  fetchUserWithUserId(@Args("userId", { type: () => String }) userId: string) {
    return this.usersService.findOneWithUserId({ userId });
  }

  // 로그인한 유저 정보 확인하기
  @UseGuards(GqlAuthAccessGuard)
  @Query(() => User)
  async fetchLoginedUser(@Context() context: any) {
    const validToken = context.req.headers["authorization"].split(" ")[1];
    // redis에서 로그아웃 상태확인하기
    if (await this.cacheManager.get(validToken)) {
      throw new UnauthorizedException("로그인하지 않았습니다.");
    }

    const result = await this.usersService.findOneWithUserId({
      userId: context.req.user.id,
    });

    return result;
  }

  // 로그인안한 user 삭제
  @Mutation(() => Boolean)
  removeUser(@Args("email", { type: () => String }) email: string) {
    return this.usersService.remove({ email });
  }

  // 로그인한 user 삭제
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async removeLoginUser(@Context() context: any) {
    const email = context.req.user.email;
    return this.usersService.remove({ email });
  }

  // 로그인한 user 정보 수정
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => User)
  updateUser(
    @Context() context: any,
    @Args("updateUserInput") updateUserInput: UpdateUserInput
  ) {
    const email = context.req.user.email;
    return this.usersService.update({ email, updateUserInput });
  }

  // 삭제된 user 복구
  @Mutation(() => Boolean)
  restoreUser(@Args("email", { type: () => String }) email: string) {
    return this.usersService.restore({ email });
  }
}
