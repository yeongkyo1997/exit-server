import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateTagInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  name: string;

  @Field(() => String)
  categoryId: string;
}
