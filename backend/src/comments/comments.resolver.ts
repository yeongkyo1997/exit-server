import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { CommentsService } from "./comments.service";
import { Comment } from "./entities/comment.entity";
import { CreateCommentInput } from "./dto/create-comment.input";
import { UpdateCommentInput } from "./dto/update-comment.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => [Comment])
  fetchComments(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string
  ) {
    return this.commentsService.findAll({ userId, boardId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Comment)
  createComment(
    @Args("createCommentInput") createCommentInput: CreateCommentInput,
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.commentsService.create({ userId, createCommentInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  updateComment(
    @Args("updateCommentInput") updateCommentInput: UpdateCommentInput,
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.commentsService.update({ userId, updateCommentInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => [String])
  removeComment(
    @Args("commentId", { nullable: true }) commentId: string,
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.commentsService.remove({ commentId, userId });
  }
}
