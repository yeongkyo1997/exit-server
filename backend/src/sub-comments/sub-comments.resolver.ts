import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { SubCommentsService } from "./sub-comments.service";
import { SubComment } from "./entities/sub-comment.entity";
import { CreateSubCommentInput } from "./dto/create-sub-comment.input";
import { UpdateSubCommentInput } from "./dto/update-sub-comment.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";

@Resolver(() => SubComment)
export class SubCommentsResolver {
  constructor(
    private readonly subCommentsService: SubCommentsService //
  ) {}

  @Query(() => [SubComment])
  fetchSubComments(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("commentId", { nullable: true }) commentId: string
  ) {
    return this.subCommentsService.findAll({ userId, commentId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => SubComment)
  createSubComment(
    @Args("createSubCommentInput") createSubCommentInput: CreateSubCommentInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.subCommentsService.create({
      userId: user.id,
      createSubCommentInput,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  updateSubComment(
    @Args("updateSubCommentInput") updateSubCommentInput: UpdateSubCommentInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.subCommentsService.update({
      userId: user.id,
      updateSubCommentInput,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => [String])
  removeSubComment(
    @Args("subCommentId", { nullable: true }) subCommentId: string,
    @Args("commentId", { nullable: true }) commentId: string, //
    @CurrentUser() user: AuthUser
  ) {
    return this.subCommentsService.remove({
      userId: user.id,
      commentId,
      subCommentId,
    });
  }
}
