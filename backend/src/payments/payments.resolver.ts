import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { Args, Context, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { IContext } from "src/commons/type/context";
import { IamportService } from "../iamport/iamport.service";
import {
  Payment,
  PAYMENT_TRANSACTION_STATUS_ENUM,
} from "./entities/payment.entity";
import { PaymentsService } from "./payments.service";

@Resolver()
export class PaymentsResolver {
  constructor(
    private readonly paymentsService: PaymentsService, //
    private readonly iamportService: IamportService
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [Payment])
  async fetchPayments(@Context() context) {
    const user = context.req.user;
    return this.paymentsService.findByUser({ user });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async createPayment(
    @Args("impUid") impUid: string,
    @Args({ name: "amount", type: () => Int }) amount: number,
    @Context() context: IContext
  ) {
    const user = context.req.user;

    const access_Token = await this.iamportService.getToken();

    // 아임포트에 실제로 결제된 내역과 금액을 기준으로 검증한다.
    const iamportPayment = await this.iamportService.verifyToken({
      accessToken: access_Token,
      impUid,
    });
    if (iamportPayment.status !== "paid")
      throw new UnprocessableEntityException("결제가 완료되지 않았습니다.");
    if (iamportPayment.amount !== amount)
      throw new UnprocessableEntityException("결제 금액이 일치하지 않습니다.");

    const validPayment = await this.paymentsService.findStatus({ impUid });
    if (validPayment) throw new ConflictException("이미 추가된 결제건입니다.");

    return this.paymentsService.create({ impUid, amount, user });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Payment)
  async createCancel(
    @Args("impUid") impUid: string,
    @Args({ name: "amount", type: () => Int }) amount: number,
    @Context() context: IContext,
    // 기존 클라이언트 호환용 인자. 취소 대상 유저는 로그인 정보로만 판단한다.
    @Args("user", { nullable: true }) _user?: string
  ) {
    const user = context.req.user;

    const paymentInf = await this.paymentsService.findStatus({
      impUid,
      status: PAYMENT_TRANSACTION_STATUS_ENUM.PAYMENT,
    });
    if (!paymentInf)
      throw new UnprocessableEntityException("취소할 결제 내역이 없습니다.");

    if (paymentInf.user.id !== user.id)
      throw new ForbiddenException("본인의 결제만 취소할 수 있습니다.");

    // 결제 취소금액이 다르면
    if (paymentInf.amount !== amount)
      throw new ConflictException("취소금액이 다릅니다.");

    const canceled = await this.paymentsService.findStatus({
      impUid,
      status: PAYMENT_TRANSACTION_STATUS_ENUM.CANCELLED,
    });
    if (canceled) throw new ConflictException("이미 결제가 취소되었습니다.");

    const accessToken = await this.iamportService.getToken();

    const validCancel = await this.iamportService.verifyToken({
      accessToken,
      impUid,
    });

    if (validCancel.status === "cancelled")
      throw new ConflictException("이미 결제가 취소되었습니다.");

    // 환불 전에 포인트를 먼저 차감해 두고, 아임포트 환불이 실패하면 되돌린다.
    return this.paymentsService.createCancel({
      impUid,
      amount,
      user,
      cancelPayment: () =>
        this.iamportService.cancelPayment({ accessToken, impUid }),
    });
  }
}
