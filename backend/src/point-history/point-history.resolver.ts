import { Resolver, Query, Args, Context } from "@nestjs/graphql";
import { PointHistoryService } from "./point-history.service";
import { PointHistory } from "./entities/point-history.entity";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";

@Resolver(() => PointHistory)
export class PointHistoryResolver {
  constructor(
    private readonly pointHistoryService: PointHistoryService //
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [PointHistory])
  fetchLoginPointHistories(
    @Context() context //
  ) {
    const userId = context.req.user.id;
    return this.pointHistoryService.findAll({ userId });
  }

  @Query(() => [PointHistory])
  fetchPointHistories(
    @Args("userId") userId: string //
  ) {
    return this.pointHistoryService.findAll({ userId });
  }

  // @Query(() => PointHistory)
  // fetchPointHistory(@Args("id") id: string) {
  //   return this.pointHistoryService.findOne(id);
  // }

  // 포인트 내역은 결제/정산 로직에서만 기록한다. 사용자가 직접 생성/수정/삭제하는 API는 두지 않는다.
}
