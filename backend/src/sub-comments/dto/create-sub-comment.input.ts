import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateSubCommentInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
