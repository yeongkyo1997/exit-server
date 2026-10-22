import { UseGuards } from "@nestjs/common";
import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { AuthUser } from "src/commons/type/context";
import { Payment } from "./entities/payment.entity";
import { PaymentsService } from "./payments.service";

@Resolver()
export class PaymentsResolver {
  constructor(
    private readonly paymentsService: PaymentsService //
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [Payment])
  async fetchPayments(@CurrentUser() user: AuthUser) {
    return this.paymentsService.findByUser({ userId: user.id });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async createPayment(
    @Args("impUid") impUid: string,
    @Args({ name: "amount", type: () => Int }) amount: number,
    @CurrentUser() user: AuthUser
  ) {
    return this.paymentsService.pay({ impUid, amount, user });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async createCancel(
    @Args("impUid") impUid: string,
    @Args({ name: "amount", type: () => Int }) amount: number,
    // 하위 호환용으로 스키마에만 남긴다. 값은 쓰지 않고 로그인 사용자 기준으로 처리한다
    @Args("user") _legacyUser: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.paymentsService.cancel({ impUid, amount, user });
  }
}
