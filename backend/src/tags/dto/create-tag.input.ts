import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateTagInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  name: string;

  @Field(() => String)
  categoryId: string;

  @Field(() => [String])
  users: string[];

  @Field(() => [String])
  boards: string[];
}
