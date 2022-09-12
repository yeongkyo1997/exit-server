import { Resolver, Query, Mutation, Args, Int, Context } from "@nestjs/graphql";
import { SubCommentsService } from "./sub-comments.service";
import { SubComment } from "./entities/sub-comment.entity";
import { CreateSubCommentInput } from "./dto/create-sub-comment.input";
import { UpdateSubCommentInput } from "./dto/update-sub-comment.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";

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
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.subCommentsService.create({ userId, createSubCommentInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  updateSubComment(
    @Args("updateSubCommentInput") updateSubCommentInput: UpdateSubCommentInput,
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.subCommentsService.update({ userId, updateSubCommentInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => [String])
  removeSubComment(
    @Args("subCommentId", { nullable: true }) subCommentId: string,
    @Args("commentId", { nullable: true }) commentId: string, //
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.subCommentsService.remove({ userId, commentId, subCommentId });
  }
}
