import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateUserImageInput {
  @Field(() => String)
  url: string;
}
