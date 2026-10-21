import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { CommentsService } from "./comments.service";
import { Comment } from "./entities/comment.entity";
import { CreateCommentInput } from "./dto/create-comment.input";
import { UpdateCommentInput } from "./dto/update-comment.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";

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
    @CurrentUser() user: AuthUser
  ) {
    return this.commentsService.create({
      userId: user.id,
      createCommentInput,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  updateComment(
    @Args("updateCommentInput") updateCommentInput: UpdateCommentInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.commentsService.update({
      userId: user.id,
      updateCommentInput,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  removeComment(
    @Args("commentId", { nullable: true }) commentId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.commentsService.remove({ commentId, userId: user.id });
  }
}
