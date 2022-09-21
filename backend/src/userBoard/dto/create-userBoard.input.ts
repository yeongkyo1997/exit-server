import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateUserBoardInput {
  @Field(() => Boolean, { nullable: true })
  isAccepted: boolean;

  @Field(() => String)
  boardId: string;
}
