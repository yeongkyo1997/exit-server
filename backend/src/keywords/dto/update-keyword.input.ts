import { CreateKeywordInput } from "./create-keyword.input";
import { InputType, Field, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateKeywordInput extends PartialType(CreateKeywordInput) {
  @Field(() => String)
  id: string;
}
