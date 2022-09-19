import { Resolver, Query, Mutation, Args, Int, Context } from "@nestjs/graphql";
import { LikesService } from "./likes.service";
import { Like } from "./entities/like.entity";
import { UseGuards } from "@nestjs/common";
import { GqlAuthRefreshGuard } from "src/commons/auth/gql-auth.guard";

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
  @UseGuards(GqlAuthRefreshGuard)
  @Mutation(() => String)
  createOrDeleteLike(
    @Args("boardId") boardId: string, //
    @Context() context: any
  ) {
    const userId = context.req.user.id;
    return this.likesService.create({ userId, boardId });
  }
}
