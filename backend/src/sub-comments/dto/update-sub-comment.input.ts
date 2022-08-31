import { CreateSubCommentInput } from "./create-sub-comment.input";
import { InputType, Field, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateSubCommentInput extends PartialType(CreateSubCommentInput) {
  @Field(() => String)
  id: string;
}
