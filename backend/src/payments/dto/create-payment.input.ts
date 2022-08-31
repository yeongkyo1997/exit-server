import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreatePaymentInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
