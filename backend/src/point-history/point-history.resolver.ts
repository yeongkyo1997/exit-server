import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { PointHistoryService } from "./point-history.service";
import { PointHistory } from "./entities/point-history.entity";
import { UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { AuthUser } from "src/commons/type/context";
import { CreatePointHistoryInput } from "./dto/create-point-history.input";
import { UpdatePointHistoryInput } from "./dto/update-point-history.input";

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

  @Query(() => [PointHistory])
  fetchPointHistories(
    @Args("userId") userId: string //
  ) {
    return this.pointHistoryService.findAll({ userId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => PointHistory)
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
  @Mutation(() => PointHistory)
  updatePointHistory(
    @Args("pointHistoryId") pointHistoryId: string, //
    @Args("updatePointHistoryInput")
    updatePointHistoryInput: UpdatePointHistoryInput
  ) {
    return this.pointHistoryService.update({
      updatePointHistoryInput,
      pointHistoryId,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  removePointHistory(
    @Args("pointHistoryId") pointHistoryId: string //
  ) {
    return this.pointHistoryService.remove({ pointHistoryId });
  }
}
