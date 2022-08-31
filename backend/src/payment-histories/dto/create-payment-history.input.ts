import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreatePaymentHistoryInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
