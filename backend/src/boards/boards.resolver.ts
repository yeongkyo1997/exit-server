import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardsService } from "./boards.service";
import { Board } from "./entities/board.entity";
import { CreateBoardInput } from "./dto/create-board.input";
import { UpdateBoardInput } from "./dto/update-board.input";

@Resolver(() => Board)
export class BoardsResolver {
  constructor(
    private readonly boardsService: BoardsService //
  ) {}

  @Query(() => [Board])
  fetchBoards(
    @Args("isSuccess", { nullable: true }) isSuccess: boolean,
    @Args("status", { nullable: true }) status: boolean
  ) {
    return this.boardsService.findAll({ isSuccess, status });
  }

  @Query(() => Board)
  fetchBoard(
    @Args("boardId") boardId: string //
  ) {
    return this.boardsService.findOne({ boardId });
  }

  @Mutation(() => Board)
  createBoard(
    @Args("createBoardInput") createBoardInput: CreateBoardInput //
  ) {
    return this.boardsService.create({ createBoardInput });
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
