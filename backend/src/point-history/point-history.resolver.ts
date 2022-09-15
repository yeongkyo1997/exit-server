import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { PointHistoryService } from "./point-history.service";
import { PointHistory } from "./entities/point-history.entity";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
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

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => PointHistory)
  createPointHistory(
    @Context() context,
    @Args("createPointHistoryInput")
    createPointHistoryInput: CreatePointHistoryInput //
  ) {
    const userId = context.req.user.id;
    return this.pointHistoryService.create({ userId, createPointHistoryInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => PointHistory)
  updatePointHistory(
    @Context() context,
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
