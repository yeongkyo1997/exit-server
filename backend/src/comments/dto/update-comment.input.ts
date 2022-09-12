import { CreateCommentInput } from "./create-comment.input";
import { Field, InputType, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateCommentInput extends PartialType(CreateCommentInput) {
  @Field(() => String)
  commentId: string;
}
