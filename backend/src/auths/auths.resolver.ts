import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AuthsService } from "./auths.service";
import { AuthUser, IContext } from "src/commons/type/context";
import { GqlAuthRefreshGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";

@Resolver()
export class AuthsResolver {
  constructor(
    private readonly authsService: AuthsService //
  ) {}

  @Mutation(() => String)
  async login(
    @Args("email") email: string, //
    @Args("password") password: string, //
    @Context() context: IContext
  ) {
    return this.authsService.login({
      email,
      password,
      req: context.req,
      res: context.res,
    });
  }

  /**
   *
   * verifyToken은 인증이 되어있는지 확인하는 것이기 때문에
   * 가드를 사용하지 않아도 된다.
   */
  @Mutation(() => String)
  async logout(@Context() context: IContext) {
    return this.authsService.logout({ req: context.req });
  }

  // 리프레시 토큰 생성
  @UseGuards(GqlAuthRefreshGuard)
  @Mutation(() => String)
  restoreAccessToken(
    @CurrentUser() user: AuthUser //
  ) {
    return this.authsService.getAccessToken({ user });
  }
}
