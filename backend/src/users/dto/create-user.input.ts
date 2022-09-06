import { InputType, Field, Int } from "@nestjs/graphql";
import { CreateUserImageInput } from "src/user-images/dto/create-user-image.input";

@InputType()
export class CreateUserInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  nickname: string;

  @Field(() => CreateUserImageInput, { defaultValue: { url: "" } })
  userImage: CreateUserImageInput;

  @Field(() => [String], { nullable: true })
  tags: string[];

  @Field(() => [String], { nullable: true })
  keywords: string[];
}
