import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateTagImageInput {
  @Field(() => String)
  url: string;
}
