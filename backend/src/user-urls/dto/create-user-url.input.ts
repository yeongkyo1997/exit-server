import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateUserUrlInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
