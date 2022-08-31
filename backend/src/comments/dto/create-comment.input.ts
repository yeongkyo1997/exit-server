import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateCommentInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
