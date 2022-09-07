import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { BoardsService } from "./boards.service";
import { Board } from "./entities/board.entity";
import { CreateBoardInput } from "./dto/create-board.input";
import { UpdateBoardInput } from "./dto/update-board.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";

@Resolver(() => Board)
export class BoardsResolver {
  constructor(
    private readonly boardsService: BoardsService //
  ) {}

  @Query(() => [Board])
  fetchBoards(
    @Args("isSuccess", { nullable: true }) isSuccess: boolean,
    @Args("status", { nullable: true }) status: boolean,
    @Args("page", { nullable: true }) page: number
  ) {
    return this.boardsService.findAll({ isSuccess, status, page });
  }

  @Query(() => [Board])
  fetchBoardsByLikes() {
    return this.boardsService.findAllByLikes();
  }

  @Query(() => Board)
  fetchBoard(
    @Args("boardId") boardId: string //
  ) {
    return this.boardsService.findOne({ boardId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Board)
  createBoard(
    @Args("createBoardInput") createBoardInput: CreateBoardInput, //
    @Context() context
  ) {
    const leader = context.req.user;
    return this.boardsService.create({ leader, createBoardInput });
  }

  @Mutation(() => Board)
  async updateBoard(
    @Args("boardId") boardId: string,
    @Args("updateBoardInput") updateBoardInput: UpdateBoardInput //
  ) {
    return this.boardsService.update({ boardId, updateBoardInput });
  }

  @Mutation(() => Boolean)
  removeBoard(
    @Args("boardId") boardId: string //
  ) {
    return this.boardsService.remove({ boardId });
  }
}
