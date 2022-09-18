import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { BoardsService } from "./boards.service";
import { Board } from "./entities/board.entity";
import { CreateBoardInput } from "./dto/create-board.input";
import { UpdateBoardInput } from "./dto/update-board.input";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import {
  CACHE_MANAGER,
  Inject,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { Cache } from "cache-manager";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { FilesService } from "src/files/files.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Resolver(() => Board)
export class BoardsResolver {
  constructor(
    private readonly boardsService: BoardsService, //

    private readonly elasticsearchService: ElasticsearchService,

    private readonly filesService: FilesService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManger: Cache,

    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>
  ) {}

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
    // 검색어가 없다면 모든 상품을 보여준다.
    if (!search)
      return this.boardsService.findAll({
        isSuccess,
        status,
        page,
        tagName,
        categoryName,
        keywordName,
      });

    // 검색어가 1글자 이하라면 에러를 발생시킨다.
    if (search.length <= 1)
      throw new Error("검색어는 2글자 이상 입력해주세요.");

    // 검색어에 공백만 있다면 에러를 발생시킨다.
    if (search.match(/^\s+$/)) throw new Error("검색어를 입력해주세요.");

    // redis에 검색어가 저장되어있는지 확인한다.
    // if (await this.cacheManger.get(search)) {
    //   return await this.cacheManger.get(search);
    // }

    // elasticsearch에서 검색어로 검색한다.
    const searchResult = await this.elasticsearchService.search({
      index: "teamboard",
      body: {
        query: {
          multi_match: {
            query: search,
            fields: ["title", "description"],
          },
        },
      },
    });

    // 최신 정보를 result에 저장한다.
    const result = searchResult.hits.hits.map((item) => item._source);

    const result2 = result.map((item: object) => {
      const boardImage =
        item["boardImage"] == null
          ? null
          : item["boardImage"].replace("{", "").replace("}", "");

      const boardImageId =
        boardImage == null ? "" : boardImage.split(",")[0].split(":")[1];

      const boardImageUrl =
        boardImage == null ? "" : boardImage.split(",")[1].split(":")[1];

      const tags = item["tags"];
      const tags2 =
        tags == null
          ? null
          : tags.split("},{").map((tag) => {
              const id = tag.split(",")[0].split(":")[1];
              const name = tag.split(",")[1].split(":")[1].replace("}", "");
              return {
                id,
                name,
              };
            });
      const keywords = item["keywords"];
      const keywords2 =
        keywords == null
          ? null
          : keywords.split("},{").map((keyword) => {
              const id = keyword.split(",")[0].split(":")[1];
              const name = keyword.split(",")[1].split(":")[1].replace("}", "");
              return {
                id,
                name,
              };
            });
      const categories = item["categories"];
      const categories2 =
        categories == null
          ? null
          : categories.split("},{").map((category) => {
              const id = category.split(",")[0].split(":")[1];
              const name = category
                .split(",")[1]
                .split(":")[1]
                .replace("}", "");
              return {
                id,
                name,
              };
            });
      return {
        ...item,
        startAt: new Date(item["startAt"]),
        endAt: new Date(item["endAt"]),
        createdAt: new Date(item["createdAt"]),
        closedAt: new Date(item["closedAt"]),
        // boardImage가 있다면 boardImageId와 boardImageUrl을 추가하고 없다면 boardImage 넣지 않는다.
        boardImage: { id: boardImageId, url: boardImageUrl },
        // tags2가 있다면 tags2를 넣고 없다면 tags2 넣지 않는다.
        tags: tags2 ? tags2 : [],
        // keywords2가 있다면 keywords2를 넣고 없다면 keywords2 넣지 않는다.
        keywords: keywords2 ? keywords2 : [],
        // categories2가 있다면 categories2를 넣고 없다면 categories2 넣지 않는다.
        categories: categories2 ? categories2 : [],
      };
    });

    // redis에 검색어와 검색결과를 저장한다.
    await this.cacheManger.set(search, result2, { ttl: 60 });
    return result2;
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
    @Context() context
  ) {
    const userId = context.req.user.id;
    return this.boardsService.findOneByCategory({ userId, categoryId });
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
  @Mutation(() => String)
  async updateBoardFinish(
    @Args("boardId") boardId: string, //
    @Context() context: any
  ) {
    const user = context.req.user;
    return this.boardsService.updateFinish({ boardId, userId: user.id });
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
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) {
      throw new UnprocessableEntityException("존재하지 않는 프로젝트입니다.");
    }
  }
}
