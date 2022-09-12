import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { BoardsService } from "./boards.service";
import { Board } from "./entities/board.entity";
import { CreateBoardInput } from "./dto/create-board.input";
import { UpdateBoardInput } from "./dto/update-board.input";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { CACHE_MANAGER, Inject, UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { Cache } from "cache-manager";

@Resolver(() => Board)
export class BoardsResolver {
  constructor(
    private readonly boardsService: BoardsService, //

    private readonly elasticsearchService: ElasticsearchService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManger: Cache
  ) {}

  @Query(() => [Board])
  async fetchBoards(
    @Args("isSuccess", { nullable: true }) isSuccess: boolean,
    @Args("status", { nullable: true }) status: boolean,
    @Args("page", { nullable: true }) page: number,
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
    if (await this.cacheManger.get(search)) {
      return await this.cacheManger.get(search);
    }

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

    // redis에 검색어와 검색결과를 저장한다.
    await this.cacheManger.set(search, result, { ttl: 60 });

    console.log("🚀 ~ file: boards.resolver.ts ~ line 76 ~ BoardsResolver ~ result", result)
    return result;
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
