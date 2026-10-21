import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardsService } from "./boards.service";
import { Board } from "./entities/board.entity";
import { CreateBoardInput } from "./dto/create-board.input";
import { UpdateBoardInput } from "./dto/update-board.input";
import { UnprocessableEntityException, UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { FilesService } from "src/files/files.service";

@Resolver(() => Board)
export class BoardsResolver {
  constructor(
    private readonly boardsService: BoardsService, //

    private readonly filesService: FilesService
  ) {}

  @Query(() => [Board])
  async fetchBoadsIsSuccess(
    @Args("isSuccess") isSuccess: boolean,
    @Args("page", { defaultValue: 1 }) page: number
  ) {
    this.boardsService.findAll({ isSuccess, page });
  }

  @Query(() => [Board])
  async fetchBoardsStatus(
    @Args("status") status: boolean,
    @Args("page", { defaultValue: 1 }) page: number
  ) {
    this.boardsService.findAll({ status, page });
  }

  @Query(() => [Board])
  async fetchBoardsTagName(
    @Args("tagName") tagName: string,
    @Args("page", { defaultValue: 1 }) page: number
  ) {
    this.boardsService.findAll({ tagName, page });
  }

  @Query(() => [Board])
  async fetchBoardsCategoryName(
    @Args("categoryName") categoryName: string,
    @Args("page", { defaultValue: 1 }) page: number
  ) {
    this.boardsService.findAll({ categoryName, page });
  }

  @Query(() => [Board])
  async fetchBoardsKeywordName(
    @Args("keywordName") keywordName: string,
    @Args("page", { defaultValue: 1 }) page: number
  ) {
    this.boardsService.findAll({ keywordName, page });
  }

  @Query(() => [Board])
  async fetchBoards(
    @Args("isSuccess", { nullable: true }) isSuccess: boolean,
    @Args("status", { nullable: true }) status: boolean,
    @Args("page", { defaultValue: 1 }) page: number,
    @Args("tagName", { nullable: true }) tagName: string,
    @Args("categoryName", { nullable: true }) categoryName: string,
    @Args("keywordName", { nullable: true }) keywordName: string,
    @Args("search", { nullable: true }) search: string
  ) {
    return this.boardsService.search({
      isSuccess,
      status,
      page,
      tagName,
      categoryName,
      keywordName,
      search,
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

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => Board)
  fetchBoardRandom(
    @Args("categoryId") categoryId: string, //
    @CurrentUser() user: AuthUser
  ) {
    return this.boardsService.randomBoardByCategory({
      userId: user.id,
      categoryId,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Board)
  createBoard(
    @Args("createBoardInput") createBoardInput: CreateBoardInput, //
    @CurrentUser() leader: AuthUser
  ) {
    return this.boardsService.create({ leader, createBoardInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Board)
  async updateBoard(
    @Args("boardId") boardId: string,
    @Args("updateBoardInput") updateBoardInput: UpdateBoardInput, //
    @CurrentUser() leader: AuthUser
  ) {
    return this.boardsService.update({ leader, boardId, updateBoardInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  async updateBoardFinish(
    @Args("boardId") boardId: string, //
    @CurrentUser() user: AuthUser
  ) {
    return this.boardsService.updateFinish({ boardId, userId: user.id });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  removeBoard(
    @Args("boardId") boardId: string, //
    @CurrentUser() leader: AuthUser
  ) {
    return this.boardsService.remove({ leader, boardId });
  }

  @Mutation(() => String)
  onClickBoard(
    @Args("boardId") boardId: string //
  ) {
    return this.boardsService.onClickBoard({ boardId });
  }

  @Mutation(() => String)
  async uploadZipFile(
    @Args("boardId") boardId: string, //
    @Args("updateBoardInput") updateBoardInput: UpdateBoardInput,
    @Args({ name: "zip", type: () => [GraphQLUpload] }) zip: FileUpload[]
  ) {
    const url = await this.filesService.upload({ file: zip, type: "zip" });
    const board = await this.boardsService.findOne({ boardId });
    updateBoardInput.projectUrl = url[0].toString();

    const result = await this.boardsService.update({
      updateBoardInput,
      leader: board.leader,
      boardId,
    });
    return result.projectUrl;
  }

  @Mutation(() => Boolean)
  async removeZipFile(
    @Args("boardId") boardId: string //
  ) {
    const board = await this.boardsService.findOne({ boardId });
    if (!board) {
      throw new UnprocessableEntityException("존재하지 않는 프로젝트입니다.");
    }
  }
}
