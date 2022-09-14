import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateTagInput {
  @Field(() => String)
  name: string;

  @Field(() => [String])
  users: string[];

  @Field(() => [String])
  boards: string[];
}
