import {
  ConflictException,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { Args, Context, Int, Mutation, Resolver } from "@nestjs/graphql";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { IContext } from "src/commons/type/context";
import { Payment } from "./entities/payment.entity";
import { PaymentsService } from "./payments.service";

@Resolver()
export class PaymentsResolver {
  constructor(
    private readonly paymentsService: PaymentsService //
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async createPayment(
    @Args("impUid") impUid: string,
    @Args({ name: "amount", type: () => Int }) amount: number,
    @Context() context: IContext
  ) {
    const user = context.req.user;

    const validPayment = await this.paymentsService.findStatus({ impUid });
    if (validPayment) throw new ConflictException("이미 추가된 결제건입니다.");

    return this.paymentsService.create({ impUid, amount, user });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async createCancel(
    @Args("impUid") impUid: string,
    @Args({ name: "amount", type: () => Int }) amount: number,
    @Context() context
  ) {
    const user = context.req.user;
    const paymentInf = await this.paymentsService.findStatus({ impUid });
    if (!paymentInf)
      throw new UnprocessableEntityException("취소할 결제 내역이 없습니다.");

    return this.paymentsService.createCancel({
      impUid,
      amount,
      user,
    });
  }
}
