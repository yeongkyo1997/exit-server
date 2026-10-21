import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserBoardService } from "./userBoard.service";
import { UserBoard } from "./entities/userBoard.entity";
import { CreateUserBoardInput } from "./dto/create-userBoard.input";
import { UpdateUserBoardInput } from "./dto/update-userBoard.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";

@Resolver(() => UserBoard)
export class UserBoardResolver {
  constructor(
    private readonly userBoardService: UserBoardService //
  ) {}

  //프로젝트를 신청한 유저들(리더 제외) 불러오는 함수
  @Query(() => [UserBoard])
  fetchUserBoards(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string,
    @Args("isAccepted", { nullable: true }) isAccepted: boolean
  ) {
    return this.userBoardService.findAll({ userId, boardId, isAccepted });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => UserBoard)
  createUserBoard(
    @CurrentUser() user: AuthUser,
    @Args("createUserBoardInput") createUserBoardInput: CreateUserBoardInput
  ) {
    return this.userBoardService.create({
      userId: user.id,
      createUserBoardInput,
    });
  }

  @Mutation(() => UserBoard)
  updateUserBoard(
    @Args("updateUserBoardInput") updateUserBoardInput: UpdateUserBoardInput
  ) {
    return this.userBoardService.update({ updateUserBoardInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => [String])
  removeUserBoards(
    @CurrentUser() user: AuthUser,
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string //
  ) {
    return this.userBoardService.removeAll({
      requesterId: user.id,
      userId,
      boardId,
    });
  }
}
