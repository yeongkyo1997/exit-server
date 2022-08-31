import { CreateUserUrlInput } from "./create-user-url.input";
import { InputType, Field, Int, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateUserUrlInput extends PartialType(CreateUserUrlInput) {
  @Field(() => String)
  id: string;
}
