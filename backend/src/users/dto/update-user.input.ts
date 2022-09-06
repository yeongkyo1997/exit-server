import { CreateUserInput } from "./create-user.input";
import { Field, InputType, Int, PartialType } from "@nestjs/graphql";
import { CreateUserImageInput } from "src/user-images/dto/create-user-image.input";

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => Int, { nullable: true })
  point: number;

  @Field(() => CreateUserImageInput, { defaultValue: { url: "" } })
  userImage: CreateUserImageInput;

  @Field(() => [String], { nullable: true })
  tags: string[];

  @Field(() => [String], { nullable: true })
  keywords: string[];

  @Field(() => [String], { nullable: true })
  categories: string[];
}
