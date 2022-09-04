import { UseGuards, UnprocessableEntityException } from "@nestjs/common";
import { Args, Mutation, Resolver, Int, Context } from "@nestjs/graphql";
import { PaymentsService } from "./payments.service";
import { Payment } from "./entities/payment.entity";
import { IamportService } from "../iamport/iamport.service";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { IContext } from "src/commons/type/context";

@Resolver()
export class PaymentsResolver {
  constructor(
    private readonly paymentsService: PaymentsService, //
    private readonly iamportService: IamportService
  ) {}

  ////////////////////////////QUERY//////////////////////////////

  ///////////////////////MUTATION////////////////////////////////

  // 결제 내역 생성
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async createPayment(
    @Args("impUid") impUid: string,
    @Args({ name: "amount", type: () => Int }) amount: number,
    @Context() context: IContext
  ) {
    const user = context.req.user;

    const accessToken = await this.iamportService.getToken();

    const importData = await this.iamportService.verifyToken({
      impUid,
      accessToken,
    });

    if (importData.status === "paid") {
      throw new UnprocessableEntityException("결제가 이미 처리되었습니다.");
    }

    if (importData.amount !== amount) {
      throw new UnprocessableEntityException("결제 금액이 일치하지 않습니다.");
    }

    await this.paymentsService.checkPaid({ user, impUid });

    return await this.paymentsService.create({
      user,
      amount,
      impUid,
    });
  }

  // 결제 취소
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async cancelPayment(
    @Args("impUid") impUid: string,
    @Context() context: IContext
  ) {
    const user = context.req.user;

    const accessToken = await this.iamportService.getToken();

    const result = await this.paymentsService.cancel({
      user,
      impUid,
      accessToken,
    });
    await this.iamportService.cancel({ impUid, accessToken });
    return result;
  }
}
