import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { LikesService } from "./likes.service";
import { Like } from "./entities/like.entity";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";

@Resolver(() => Like)
export class LikesResolver {
  constructor(
    private readonly likesService: LikesService //
  ) {}

  @Query(() => [Like])
  fetchLikes(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string
  ) {
    return this.likesService.findAll({ userId, boardId });
  }
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  createOrDeleteLike(
    @Args("boardId") boardId: string, //
    @CurrentUser() user: AuthUser
  ) {
    return this.likesService.create({ userId: user.id, boardId });
  }
}
