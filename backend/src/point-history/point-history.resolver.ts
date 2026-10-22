import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { PointHistoryService } from "./point-history.service";
import { PointHistory } from "./entities/point-history.entity";
import { ForbiddenException, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { AuthUser } from "src/commons/type/context";
import { CreatePointHistoryInput } from "./dto/create-point-history.input";
import { UpdatePointHistoryInput } from "./dto/update-point-history.input";

// 포인트 내역은 결제·환불·정산 때 서버가 직접 기록한다
const POINT_HISTORY_DEPRECATION = "포인트 내역은 서버가 기록합니다.";

@Resolver(() => PointHistory)
export class PointHistoryResolver {
  constructor(
    private readonly pointHistoryService: PointHistoryService //
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [PointHistory])
  fetchLoginPointHistories(
    @CurrentUser() user: AuthUser //
  ) {
    return this.pointHistoryService.findAll({ userId: user.id });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [PointHistory])
  fetchPointHistories(
    @Args("userId") userId: string, //
    @CurrentUser() user: AuthUser
  ) {
    // 포인트 내역(결제 정보)은 본인 것만 볼 수 있다
    if (!user?.id || userId !== user.id)
      throw new ForbiddenException("본인의 포인트 내역만 조회할 수 있습니다.");
    return this.pointHistoryService.findAll({ userId: user.id });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => PointHistory, {
    deprecationReason: POINT_HISTORY_DEPRECATION,
  })
  createPointHistory(
    @CurrentUser() user: AuthUser,
    @Args("createPointHistoryInput")
    createPointHistoryInput: CreatePointHistoryInput //
  ) {
    return this.pointHistoryService.create({
      userId: user.id,
      createPointHistoryInput,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => PointHistory, {
    deprecationReason: POINT_HISTORY_DEPRECATION,
  })
  updatePointHistory(
    @Args("pointHistoryId") pointHistoryId: string, //
    @Args("updatePointHistoryInput")
    updatePointHistoryInput: UpdatePointHistoryInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.pointHistoryService.update({
      userId: user.id,
      updatePointHistoryInput,
      pointHistoryId,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean, {
    deprecationReason: POINT_HISTORY_DEPRECATION,
  })
  removePointHistory(
    @Args("pointHistoryId") pointHistoryId: string, //
    @CurrentUser() user: AuthUser
  ) {
    return this.pointHistoryService.remove({
      userId: user.id,
      pointHistoryId,
    });
  }
}
