import { Module } from '@nestjs/common';
import { PaymentHistoriesService } from './payment-histories.service';
import { PaymentHistoriesResolver } from './payment-histories.resolver';

@Module({
  providers: [PaymentHistoriesResolver, PaymentHistoriesService]
})
export class PaymentHistoriesModule {}
