import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PaymentHistoriesService } from './payment-histories.service';
import { PaymentHistory } from './entities/payment-history.entity';
import { CreatePaymentHistoryInput } from './dto/create-payment-history.input';
import { UpdatePaymentHistoryInput } from './dto/update-payment-history.input';

@Resolver(() => PaymentHistory)
export class PaymentHistoriesResolver {
  constructor(private readonly paymentHistoriesService: PaymentHistoriesService) {}

  @Mutation(() => PaymentHistory)
  createPaymentHistory(@Args('createPaymentHistoryInput') createPaymentHistoryInput: CreatePaymentHistoryInput) {
    return this.paymentHistoriesService.create(createPaymentHistoryInput);
  }

  @Query(() => [PaymentHistory], { name: 'paymentHistories' })
  findAll() {
    return this.paymentHistoriesService.findAll();
  }

  @Query(() => PaymentHistory, { name: 'paymentHistory' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.paymentHistoriesService.findOne(id);
  }

  @Mutation(() => PaymentHistory)
  updatePaymentHistory(@Args('updatePaymentHistoryInput') updatePaymentHistoryInput: UpdatePaymentHistoryInput) {
    return this.paymentHistoriesService.update(updatePaymentHistoryInput.id, updatePaymentHistoryInput);
  }

  @Mutation(() => PaymentHistory)
  removePaymentHistory(@Args('id', { type: () => Int }) id: number) {
    return this.paymentHistoriesService.remove(id);
  }
}
