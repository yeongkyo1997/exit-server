import { InputType, Field, Int } from "@nestjs/graphql";

@InputType()
export class CreatePointHistoryInput {
  @Field(() => String)
  pointHistory: string;

  @Field(() => Int)
  amount: number;
}
