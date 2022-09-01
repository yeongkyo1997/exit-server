import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { CommentsService } from "./comments.service";
import { Comment } from "./entities/comment.entity";
import { CreateCommentInput } from "./dto/create-comment.input";
import { UpdateCommentInput } from "./dto/update-comment.input";

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => [Comment], { name: "comments" })
  findAll() {
    return this.commentsService.findAll();
  }

  @Query(() => Comment, { name: "comment" })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.commentsService.findOne(id);
  }

  @Mutation(() => Comment)
  createComment(
    @Args("createCommentInput") createCommentInput: CreateCommentInput
  ) {
    return this.commentsService.create(createCommentInput);
  }

  @Mutation(() => Comment)
  updateComment(
    @Args("updateCommentInput") updateCommentInput: UpdateCommentInput
  ) {
    return this.commentsService.update(
      updateCommentInput.id,
      updateCommentInput
    );
  }

  @Mutation(() => Comment)
  removeComment(@Args("id", { type: () => String }) id: string) {
    return this.commentsService.remove(id);
  }
}
