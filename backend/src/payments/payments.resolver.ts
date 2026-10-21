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
    return this.paymentsService.findByUser({ user });
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
    @Args("user") user: string
  ) {
    return this.paymentsService.cancel({ impUid, amount, user });
  }
}
