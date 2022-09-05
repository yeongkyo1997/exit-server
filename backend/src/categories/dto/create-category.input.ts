import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateCategoryInput {
  @Field(() => String)
  name: string;
}
