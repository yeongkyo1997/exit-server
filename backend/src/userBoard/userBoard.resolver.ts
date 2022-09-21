import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UserBoardService } from "./userBoard.service";
import { UserBoard } from "./entities/userBoard.entity";
import { CreateUserBoardInput } from "./dto/create-userBoard.input";
import { UpdateUserBoardInput } from "./dto/update-userBoard.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";

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
    @Context() context: any,
    @Args("createUserBoardInput") createUserBoardInput: CreateUserBoardInput
  ) {
    const userId = context.req.user.id;
    return this.userBoardService.create({ userId, createUserBoardInput });
  }

  @Mutation(() => UserBoard)
  updateUserBoard(
    @Args("updateUserBoardInput") updateUserBoardInput: UpdateUserBoardInput
  ) {
    return this.userBoardService.update({ updateUserBoardInput });
  }

  @Mutation(() => [String])
  removeUserBoards(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string //
  ) {
    return this.userBoardService.removeAll({ userId, boardId });
  }
}
