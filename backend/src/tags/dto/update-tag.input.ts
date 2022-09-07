import { CreateTagInput } from "./create-tag.input";
import { Field, InputType, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateTagInput extends PartialType(CreateTagInput) {
  @Field(() => String)
  id: string;
}
