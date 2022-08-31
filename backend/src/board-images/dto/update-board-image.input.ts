import { CreateBoardImageInput } from "./create-board-image.input";
import { InputType, Field, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateBoardImageInput extends PartialType(CreateBoardImageInput) {
  @Field(() => String)
  id: string;
}
