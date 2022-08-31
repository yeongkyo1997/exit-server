import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardsService } from "./boards.service";
import { Board } from "./entities/board.entity";
import { CreateBoardInput } from "./dto/create-board.input";
import { UpdateBoardInput } from "./dto/update-board.input";

@Resolver(() => Board)
export class BoardsResolver {
  constructor(private readonly boardsService: BoardsService) {}

  @Mutation(() => Board)
  createBoard(@Args("createBoardInput") createBoardInput: CreateBoardInput) {
    return this.boardsService.create(createBoardInput);
  }

  @Query(() => [Board], { name: "boards" })
  findAll() {
    return this.boardsService.findAll();
  }

  @Query(() => Board, { name: "board" })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.boardsService.findOne(id);
  }

  @Mutation(() => Board)
  updateBoard(@Args("updateBoardInput") updateBoardInput: UpdateBoardInput) {
    return this.boardsService.update(updateBoardInput.id, updateBoardInput);
  }

  @Mutation(() => Board)
  removeBoard(@Args("id", { type: () => String }) id: string) {
    return this.boardsService.remove(id);
  }
}
