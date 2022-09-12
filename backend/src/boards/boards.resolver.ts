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
    @Args("page", { nullable: true }) page: number,
    @Args("tagName", { nullable: true }) tagName: string,
    @Args("categoryName", { nullable: true }) categoryName: string,
    @Args("keywordName", { nullable: true }) keywordName: string
  ) {
    if (!page) page = 1;
    return this.boardsService.findAll({
      isSuccess,
      status,
      page,
      tagName,
      categoryName,
      keywordName,
    });
  }

  @Query(() => [Board])
  fetchBoardsByLikes(
    @Args("isSuccess", { nullable: true }) isSuccess: boolean,
    @Args("status", { nullable: true }) status: boolean,
    @Args("page", { nullable: true }) page: number,
    @Args("tagName", { nullable: true }) tagName: string,
    @Args("categoryName", { nullable: true }) categoryName: string,
    @Args("keywordName", { nullable: true }) keywordName: string
  ) {
    if (!page) page = 1;
    return this.boardsService.findAllByLikes({
      isSuccess,
      status,
      page,
      tagName,
      categoryName,
      keywordName,
    });
  }

  @Query(() => Board)
  fetchBoard(
    @Args("boardId") boardId: string //
  ) {
    return this.boardsService.findOne({ boardId });
  }

  // @Query(() => Board)
  // pickRandomBoardByCategory(
  //   @Args("categoryName") categoryName: string //
  // ) {
  //   return this.boardsService.findOneByCategory({ categoryName });
  // }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Board)
  createBoard(
    @Args("createBoardInput") createBoardInput: CreateBoardInput, //
    @Context() context
  ) {
    const leader = context.req.user;
    return this.boardsService.create({ leader, createBoardInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Board)
  async updateBoard(
    @Args("boardId") boardId: string,
    @Args("updateBoardInput") updateBoardInput: UpdateBoardInput, //
    @Context() context
  ) {
    const leader = context.req.user;
    return this.boardsService.update({ leader, boardId, updateBoardInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  removeBoard(
    @Args("boardId") boardId: string, //
    @Context() context
  ) {
    const leader = context.req.user;
    return this.boardsService.remove({ leader, boardId });
  }
}
