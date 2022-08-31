import { CreatePaymentInput } from "./create-payment.input";
import { InputType, Field, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdatePaymentInput extends PartialType(CreatePaymentInput) {
  @Field(() => String)
  id: string;
}
