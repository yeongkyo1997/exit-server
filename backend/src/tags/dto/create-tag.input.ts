import { InputType, Field } from "@nestjs/graphql";
import { CreateTagImageInput } from "src/tag-images/dto/create-tag-image.input";

@InputType()
export class CreateTagInput {
  @Field(() => String)
  name: string;

  @Field(() => [String])
  users: string[];

  @Field(() => [String])
  boards: string[];

  @Field(() => CreateTagImageInput, { defaultValue: { url: "" } })
  tagImage?: CreateTagImageInput;
}
