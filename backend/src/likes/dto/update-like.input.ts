import { CreateLikeInput } from "./create-like.input";
import { InputType, Field, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateLikeInput extends PartialType(CreateLikeInput) {
  @Field(() => String)
  id: string;
}
