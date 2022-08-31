import { Injectable } from '@nestjs/common';
import { CreatePaymentHistoryInput } from './dto/create-payment-history.input';
import { UpdatePaymentHistoryInput } from './dto/update-payment-history.input';

@Injectable()
export class PaymentHistoriesService {
  create(createPaymentHistoryInput: CreatePaymentHistoryInput) {
    return 'This action adds a new paymentHistory';
  }

  findAll() {
    return `This action returns all paymentHistories`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paymentHistory`;
  }

  update(id: number, updatePaymentHistoryInput: UpdatePaymentHistoryInput) {
    return `This action updates a #${id} paymentHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} paymentHistory`;
  }
}
