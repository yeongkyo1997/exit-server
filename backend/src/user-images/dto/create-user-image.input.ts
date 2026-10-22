import { InputType, Field } from "@nestjs/graphql";
import { NO_IMAGE_URL } from "src/commons/constants";

@InputType()
export class CreateUserImageInput {
  @Field(() => String, { defaultValue: NO_IMAGE_URL })
  url: string;
}
