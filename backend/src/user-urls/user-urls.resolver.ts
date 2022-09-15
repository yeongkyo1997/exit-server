import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UserUrlsService } from "./user-urls.service";
import { UserUrl } from "./entities/user-url.entity";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";

@Resolver(() => UserUrl)
export class UserUrlsResolver {
  constructor(
    private readonly userUrlsService: UserUrlsService //
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [UserUrl])
  fetchLoginUserUrls(
    @Context() context //
  ) {
    const userId = context.req.user.id;
    return this.userUrlsService.findAll({ userId });
  }

  @Query(() => [UserUrl])
  fetchUserUrls(
    @Args("userId") userId: string //
  ) {
    return this.userUrlsService.findAll({ userId });
  }

  // @Query(() => UserUrl)
  // fetchUserUrl(@Args("id") id: string) {
  //   return this.userUrlsService.findOne(id);
  // }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => UserUrl)
  createUserUrl(
    @Args("userUrl") userUrl: string, //
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.userUrlsService.create({ userId, userUrl });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => UserUrl)
  updateUserUrl(
    @Args("userUrlId") userUrlId: string, //
    @Args("userUrl") userUrl: string,
    @Context() context
  ) {
    return this.userUrlsService.update({ userUrl, userUrlId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  removeUserUrl(
    @Args("userUrlId") userUrlId: string //
  ) {
    return this.userUrlsService.remove({ userUrlId });
  }
}
