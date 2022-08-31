import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { PaymentsService } from "./payments.service";
import { Payment } from "./entities/payment.entity";
import { CreatePaymentInput } from "./dto/create-payment.input";
import { UpdatePaymentInput } from "./dto/update-payment.input";

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation(() => Payment)
  createPayment(
    @Args("createPaymentInput") createPaymentInput: CreatePaymentInput
  ) {
    return this.paymentsService.create(createPaymentInput);
  }

  @Query(() => [Payment], { name: "payments" })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Query(() => Payment, { name: "payment" })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Mutation(() => Payment)
  updatePayment(
    @Args("updatePaymentInput") updatePaymentInput: UpdatePaymentInput
  ) {
    return this.paymentsService.update(
      updatePaymentInput.id,
      updatePaymentInput
    );
  }

  @Mutation(() => Payment)
  removePayment(@Args("id", { type: () => String }) id: string) {
    return this.paymentsService.remove(id);
  }
}
