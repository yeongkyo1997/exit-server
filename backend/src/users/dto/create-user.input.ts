import { InputType, Field } from "@nestjs/graphql";
import { CreateUserImageInput } from "src/user-images/dto/create-user-image.input";

@InputType()
export class CreateUserInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  nickname: string;

  @Field(() => String)
  description: string;

  @Field(() => Boolean)
  isRemote: boolean;

  @Field(() => Int)
  point: number;

  @Field(() => String)
  history: string;

  @Field(() => CreateUserImageInput)
  userImage: CreateUserImageInput;

  @Field(() => [String])
  tags: string[];

  @Field(() => [String])
  boards: string[];

  @Field(() => [String])
  keywords: string[];
}
