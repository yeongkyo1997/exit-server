import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { CommentsService } from "./comments.service";
import { Comment } from "./entities/comment.entity";
import { CreateCommentInput } from "./dto/create-comment.input";
import { UpdateCommentInput } from "./dto/update-comment.input";

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

  @Mutation(() => Comment)
  createComment(
    @Args("createCommentInput") createCommentInput: CreateCommentInput
  ) {
    return this.commentsService.create({ createCommentInput });
  }

  @Mutation(() => String)
  updateComment(
    @Args("updateCommentInput") updateCommentInput: UpdateCommentInput
  ) {
    return this.commentsService.update({ updateCommentInput });
  }

  @Mutation(() => [String])
  removeComment(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string
  ) {
    return this.commentsService.remove({ userId, boardId });
  }
}
