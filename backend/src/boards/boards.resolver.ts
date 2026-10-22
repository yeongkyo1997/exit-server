import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardsService } from "./boards.service";
import { Board } from "./entities/board.entity";
import { CreateBoardInput } from "./dto/create-board.input";
import { UpdateBoardInput } from "./dto/update-board.input";
import { UseGuards } from "@nestjs/common";
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

  // 리더만, 리더 확인을 업로드보다 먼저 한다. projectUrl만 바꾼다
  // (updateBoardInput은 스키마 호환을 위해 남겨 두지만 쓰지 않는다. 다른 필드는 updateBoard로 바꾼다)
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  async uploadZipFile(
    @Args("boardId") boardId: string, //
    @Args("updateBoardInput") _updateBoardInput: UpdateBoardInput,
    @Args({ name: "zip", type: () => [GraphQLUpload] }) zip: FileUpload[],
    @CurrentUser() user: AuthUser
  ) {
    await this.boardsService.findOwnedBoard({ boardId, userId: user.id });
    const [url] = await this.filesService.upload({
      file: zip.slice(0, 1),
      type: "zip",
    });
    return this.boardsService.updateProjectUrl({ boardId, projectUrl: url });
  }

  // 리더만 projectUrl을 비울 수 있다 (Board.projectUrl의 기본값이 "")
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async removeZipFile(
    @Args("boardId") boardId: string, //
    @CurrentUser() user: AuthUser
  ) {
    await this.boardsService.findOwnedBoard({ boardId, userId: user.id });
    await this.boardsService.updateProjectUrl({ boardId, projectUrl: "" });
    return true;
  }
}
