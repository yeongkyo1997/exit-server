import { CreatePaymentHistoryInput } from './create-payment-history.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdatePaymentHistoryInput extends PartialType(CreatePaymentHistoryInput) {
  @Field(() => Int)
  id: number;
}
