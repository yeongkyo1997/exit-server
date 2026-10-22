import { InputType, Field } from "@nestjs/graphql";
import { CreateUserImageInput } from "src/user-images/dto/create-user-image.input";
import { NO_IMAGE_URL } from "src/commons/constants";

@InputType()
export class CreateUserInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  nickname: string;

  @Field(() => CreateUserImageInput, { defaultValue: { url: NO_IMAGE_URL } })
  userImage: CreateUserImageInput;
}
