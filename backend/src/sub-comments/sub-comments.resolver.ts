import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { SubCommentsService } from "./sub-comments.service";
import { SubComment } from "./entities/sub-comment.entity";
import { CreateSubCommentInput } from "./dto/create-sub-comment.input";
import { UpdateSubCommentInput } from "./dto/update-sub-comment.input";

@Resolver(() => SubComment)
export class SubCommentsResolver {
  constructor(private readonly subCommentsService: SubCommentsService) {}

  @Mutation(() => SubComment)
  createSubComment(
    @Args("createSubCommentInput") createSubCommentInput: CreateSubCommentInput
  ) {
    return this.subCommentsService.create(createSubCommentInput);
  }

  @Query(() => [SubComment], { name: "subComments" })
  findAll() {
    return this.subCommentsService.findAll();
  }

  @Query(() => SubComment, { name: "subComment" })
  findOne(@Args("id", { type: () => Int }) id: string) {
    return this.subCommentsService.findOne(id);
  }

  @Mutation(() => SubComment)
  updateSubComment(
    @Args("updateSubCommentInput") updateSubCommentInput: UpdateSubCommentInput
  ) {
    return this.subCommentsService.update(
      updateSubCommentInput.id,
      updateSubCommentInput
    );
  }

  @Mutation(() => SubComment)
  removeSubComment(@Args("id", { type: () => Int }) id: string) {
    return this.subCommentsService.remove(id);
  }
}
