import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateKeywordInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
