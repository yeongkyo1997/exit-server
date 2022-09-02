import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { AuthsService } from "./auths.service";
import * as bcrypt from "bcrypt";
import { UsersService } from "src/users/users.service";
import {
  CACHE_MANAGER,
  Inject,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Cache } from "cache-manager";
import { IContext } from "src/commons/type/context";

@Resolver()
export class AuthsResolver {
  constructor(
    private readonly authsService: AuthsService, //
    private readonly usersService: UsersService, //
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache //
  ) {}

  @Mutation(() => String)
  async login(
    @Args("email") email: string, //
    @Args("password") password: string, //
    @Context() context: IContext
  ) {
    // 1. email로 유저 찾기
    const user = await this.usersService.findOneWithEmail({ email });

    // 2. 일치하는 유저가 없으면 에러
    if (!user) {
      throw new UnprocessableEntityException("존재하지 않는 이메일입니다.");
    }

    // 3. 일치하는 유저가 있지만, 비밀번호가 일치하지 않으면!? 에러 발생
    const isAuth = await bcrypt.compare(password, user.password);
    if (!isAuth) {
      throw new UnprocessableEntityException("비밀번호가 일치하지 않습니다.");
    }

    // 4. 일치하는 유저가 있고, 비밀번호가 일치하면?!
    this.authsService.setRefreshToken({ user, res: context.res });

    // 5. 토큰 발급
    return this.authsService.getAccessToken({ user });
  }
}
