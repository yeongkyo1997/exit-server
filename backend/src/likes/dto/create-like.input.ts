import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateLikeInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  boardId: string;
}
