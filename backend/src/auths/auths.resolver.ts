import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { AuthsService } from "./auths.service";
import * as bcrypt from "bcrypt";
import { UsersService } from "src/users/users.service";
import {
  CACHE_MANAGER,
  Inject,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { Cache } from "cache-manager";
import { IContext } from "src/commons/type/context";
import * as jwt from "jsonwebtoken";
import { GqlAuthRefreshGuard } from "src/commons/auth/gql-auth.guard";

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
    const user = await this.usersService.findOneByEmail({ email });

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
    this.authsService.setRefreshToken({
      user,
      res: context.res,
      req: context.req,
    });

    // 5. 토큰 발급
    return this.authsService.getAccessToken({ user });
  }

  /**
   *
   * verifyToken은 인증이 되어있는지 확인하는 것이기 때문에
   * 가드를 사용하지 않아도 된다.
   */
  @Mutation(() => String)
  async logout(@Context() context: IContext) {
    const accessToken = context.req.headers["authorization"].split(" ")[1];
    const refreshToken = context.req.headers["cookie"].split("=")[1];

    /**
     * 인증이 되었는지 확인하는 로직
     */
    try {
      jwt.verify(accessToken, "myAccessKey");
      jwt.verify(refreshToken, "myRefreshKey");
    } catch {
      throw new UnauthorizedException();
    }

    /**
     * 캐시에서 토큰을 삭제하는 로직
     * 토큰의 유효시간에 맞게 ttl을 설정해줬다.
     */
    await this.cacheManager.set(`accessToken:${accessToken}`, "accessToken", {
      ttl: 60 * 60, // 1시간
    });
    await this.cacheManager.set(
      `refreshToken:${refreshToken}`,
      "refreshToken",
      {
        ttl: 60 * 60 * 24 * 7 * 2, // 2주
      }
    );
    return "로그아웃에 성공했습니다.";
  }

  // 리프레시 토큰 생성
  @UseGuards(GqlAuthRefreshGuard)
  @Mutation(() => String)
  restoreAccessToken(
    @Context() context: IContext //
  ) {
    return this.authsService.getAccessToken({ user: context.req.user });
  }
}
