import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateUserImageInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
