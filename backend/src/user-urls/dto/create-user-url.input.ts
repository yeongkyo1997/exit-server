import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateUserUrlInput {
  @Field(() => String)
  user: string;
}
