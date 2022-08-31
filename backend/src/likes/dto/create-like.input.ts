import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateLikeInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
