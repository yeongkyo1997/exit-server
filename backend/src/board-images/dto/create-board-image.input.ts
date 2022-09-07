import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateBoardImageInput {
  @Field(() => String, { defaultValue: "" })
  url: string;
}
