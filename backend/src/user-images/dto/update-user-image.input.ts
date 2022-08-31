import { CreateUserImageInput } from "./create-user-image.input";
import { InputType, Field, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateUserImageInput extends PartialType(CreateUserImageInput) {
  @Field(() => String)
  id: string;
}
