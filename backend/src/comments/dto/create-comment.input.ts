import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateCommentInput {
  @Field(() => String)
  comment: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  boardId: string;
}
