import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreatePaymentInput {
  @Field(() => Number)
  amount: number;

  @Field(() => String)
  method: string;

  @Field(() => Boolean)
  isCancel: boolean;

  @Field(() => String)
  userId: string;
}
