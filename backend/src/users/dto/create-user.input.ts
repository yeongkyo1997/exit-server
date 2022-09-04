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

  @Field(() => String)
  description: string;

  @Field(() => Int, { nullable: true })
  point: number;

  @Field(() => CreateUserImageInput, { nullable: true })
  userImage: CreateUserImageInput;

  @Field(() => [String])
  tags: string[];

  @Field(() => [String])
  keywords: string[];
}
