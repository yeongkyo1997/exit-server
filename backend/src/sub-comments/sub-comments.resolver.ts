import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { SubCommentsService } from "./sub-comments.service";
import { SubComment } from "./entities/sub-comment.entity";
import { CreateSubCommentInput } from "./dto/create-sub-comment.input";
import { UpdateSubCommentInput } from "./dto/update-sub-comment.input";

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

  @Mutation(() => SubComment)
  createSubComment(
    @Args("createSubCommentInput") createSubCommentInput: CreateSubCommentInput
  ) {
    return this.subCommentsService.create({ createSubCommentInput });
  }

  @Mutation(() => String)
  updateSubComment(
    @Args("updateSubCommentInput") updateSubCommentInput: UpdateSubCommentInput
  ) {
    return this.subCommentsService.update({ updateSubCommentInput });
  }

  @Mutation(() => [String])
  removeSubComment(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("commentId", { nullable: true }) commentId: string
  ) {
    return this.subCommentsService.remove({ userId, commentId });
  }
}
