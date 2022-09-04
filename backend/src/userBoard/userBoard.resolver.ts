import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserBoardService } from "./userBoard.service";
import { UserBoard } from "./entities/userBoard.entity";
import { CreateUserBoardInput } from "./dto/create-userBoard.input";
import { UpdateUserBoardInput } from "./dto/update-userBoard.input";

@Resolver(() => UserBoard)
export class UserBoardResolver {
  constructor(
    private readonly userBoardService: UserBoardService //
  ) {}

  @Query(() => [UserBoard])
  fetchUserBoards(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string,
    @Args("isAccepted", { nullable: true }) isAccepted: boolean
  ) {
    return this.userBoardService.findAll({ userId, boardId, isAccepted });
  }

  // @Query(() => UserBoard)
  // fetchUserBoard(
  //   @Args("userId", { nullable: true }) userId: string, //
  //   @Args("boardId", { nullable: true }) boardId: string
  // ) {
  //   return this.userBoardService.findOne({ userId, boardId });
  // }

  @Mutation(() => UserBoard)
  createUserBoard(
    @Args("createUserBoardInput") createUserBoardInput: CreateUserBoardInput
  ) {
    return this.userBoardService.create({ createUserBoardInput });
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
