import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { AttendanceService } from "src/attendance/attendance.service";
import { BoardImage } from "src/board-images/entities/board-image.entity";
import { Category } from "src/categories/entities/category.entity";
import { BOARD_RELATIONS } from "src/commons/relations";
import { toLocalDate } from "src/commons/utils/date";
import {
  FAIL_REWARD_RATE,
  NO_IMAGE_URL,
  SUCCESS_ATTENDANCE_PERCENT,
  SUCCESS_REWARD_RATE,
} from "src/commons/constants";
import {
  deleteJoinRows,
  findOrCreateByName,
} from "src/commons/utils/repository";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { PointHistory } from "src/point-history/entities/point-history.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import {
  assertEnoughPoint,
  assertNoOngoingProject,
} from "src/userBoard/userBoard.rules";
import { User } from "src/users/entities/user.entity";
import { DataSource, FindOptionsOrder, In, Not, Repository } from "typeorm";
import { CreateBoardInput } from "./dto/create-board.input";
import { Board } from "./entities/board.entity";

interface BoardFilter {
  isSuccess?: boolean;
  status?: boolean;
  page?: number;
  tagName?: string;
  categoryName?: string;
  keywordName?: string;
}

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Keyword)
    private readonly keywordRepository: Repository<Keyword>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(UserBoard)
    private readonly userBoardRepository: Repository<UserBoard>,
    @InjectRepository(BoardImage)
    private readonly boardImageRepository: Repository<BoardImage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly dataSource: DataSource,
    private readonly attendanceService: AttendanceService,
    private readonly elasticsearchService: ElasticsearchService
  ) {}

  findAll(filter: BoardFilter) {
    return this.findBoards(filter, { createdAt: "DESC" });
  }

  findAllByLikes(filter: BoardFilter) {
    return this.findBoards(filter, { countLike: "DESC" });
  }

  // where는 키를 하나씩 적는다 (page 등이 where에 들어가면 안 된다)
  private findBoards(
    {
      isSuccess,
      status,
      page,
      tagName,
      categoryName,
      keywordName,
    }: BoardFilter,
    order: FindOptionsOrder<Board>
  ) {
    return this.boardRepository.find({
      where: {
        isSuccess,
        status,
        tags: { name: tagName },
        categories: { name: categoryName },
        keywords: { name: keywordName },
      },
      order,
      relations: BOARD_RELATIONS,
      take: 10,
      skip: (page - 1) * 10 || 0,
    });
  }

  // 전달받은 ids 순서(elasticsearch 관련도 순)대로 정렬하고, 삭제된 게시글은 제외한다.
  private async findAllByIds(ids: string[]) {
    if (!ids.length) return [];

    const boards = await this.boardRepository.find({
      where: { id: In(ids) },
      relations: BOARD_RELATIONS,
    });

    return ids
      .map((id) => boards.find((board) => board.id === id))
      .filter(Boolean);
  }

  async search({ search, ...filter }: BoardFilter & { search?: string }) {
    // 검색어가 없다면 모든 상품을 보여준다.
    if (!search) return this.findAll(filter);

    // 검색어가 1글자 이하라면 에러를 발생시킨다.
    if (search.length <= 1)
      throw new Error("검색어는 2글자 이상 입력해주세요.");

    // 검색어에 공백만 있다면 에러를 발생시킨다.
    if (search.match(/^\s+$/)) throw new Error("검색어를 입력해주세요.");

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

    // elasticsearch 검색 결과의 id로 DB에서 최신 게시글을 조회한다.
    const ids = searchResult.hits.hits.map((hit) => hit._id);
    const result = await this.findAllByIds(ids);

    // 검색 결과는 redis에 저장하지 않는다 (사용자가 정한 검색어가 키가 되면 다른 키를 덮어쓸 수 있다)
    return result;
  }

  findOne({ boardId }) {
    return this.boardRepository.findOne({
      where: { id: boardId },
      relations: BOARD_RELATIONS,
    });
  }

  async randomBoardByCategory({ userId, categoryId }) {
    // 모집중인 프로젝트들
    const waitingInfo = await this.boardRepository.find({
      select: { id: true, startAt: true },
      where: {
        isSuccess: false,
        status: false,
      },
    });

    const newWaitingInfo = waitingInfo.filter(
      (ele) => new Date(ele.startAt) > toLocalDate()
    );

    // 카테고리가 포함된 프로젝트들
    const filtTemp = await this.dataSource
      .createQueryBuilder()
      .select("boardId")
      .from("board_categories_category", "bc")
      .where("categoryId = :categoryId", {
        categoryId: categoryId,
      })
      .execute();

    const filt = new Set(filtTemp.map((i) => i.boardId));

    //내가 지원하거나 포함된 프로젝트들
    const appliedTemp = await this.userBoardRepository.find({
      where: { user: { id: userId } },
      relations: ["user", "board"],
    });

    // board가 soft delete된 행은 여기서 TypeError가 난다 (기존 동작 유지)
    const applied = new Set(appliedTemp.map((i) => i.board.id));

    const filteredInfo = newWaitingInfo.filter(
      (ele) => filt.has(ele.id) && !applied.has(ele.id)
    );

    const chosen =
      filteredInfo[Math.floor(Math.random() * filteredInfo.length)];
    // id 없이 findOne을 부르면 첫 행이 나오므로 후보가 없으면 바로 끝낸다
    if (!chosen) return undefined;

    return this.boardRepository.findOne({
      where: { id: chosen.id },
      relations: BOARD_RELATIONS,
    });
  }

  async create({ leader, createBoardInput }) {
    const checkPoint = await this.userRepository.findOne({
      where: { id: leader.id },
    });

    const { boardImage, tags, keywords, categories, ...board } =
      createBoardInput;
    assertEnoughPoint(checkPoint, board);
    this.assertBoardRules(board);
    await assertNoOngoingProject(this.userBoardRepository, leader.id);

    // 썸네일 저장 후 이미지DB에 저장하는 로직
    const boardImageResult = await this.boardImageRepository.save({
      url: boardImage.url,
    });

    // 다대다 확인 후 등록 로직
    const tagsResult = await findOrCreateByName(this.tagRepository, tags);
    const keywordsResult = await findOrCreateByName(
      this.keywordRepository,
      keywords
    );
    const categoriesResult = await findOrCreateByName(
      this.categoryRepository,
      categories
    );

    const savedInfo = await this.boardRepository.save({
      ...board,
      // 생성 시점에 성공한 프로젝트는 있을 수 없다 (클라이언트 값 무시)
      isSuccess: false,
      leader: leader.id,
      leaderNickname: leader.nickname,
      boardImage: boardImageResult,
      tags: tagsResult,
      keywords: keywordsResult,
      categories: categoriesResult,
    });

    // userBoard에도 저장
    await this.userBoardRepository.save({
      user: leader,
      board: savedInfo.id,
      isAccepted: true,
    });

    return savedInfo;
  }

  async update({ leader, boardId, updateBoardInput }) {
    const originBoard = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage"],
    });

    const { boardImage, tags, keywords, categories, ...updateBoard } =
      updateBoardInput;

    if (originBoard.leader != leader.id) throw Error("작성자가 아닙니다.");
    this.assertBoardRules(updateBoard);

    // 아래 검사는 거부될 때 분류 join 행이 지워지지 않도록 deleteJoinRows보다 먼저 한다
    // 신청자·참여자가 생긴 뒤에는 보석금을 바꿀 수 없다 (정산 금액이 신청 시점 조건과 달라진다)
    if (updateBoard.bail != null && updateBoard.bail !== originBoard.bail) {
      const others = await this.userBoardRepository.count({
        where: { board: { id: boardId }, user: { id: Not(leader.id) } },
      });
      if (others > 0)
        throw Error(
          "신청자나 참여자가 있는 프로젝트는 보석금을 바꿀 수 없습니다."
        );
      // 바꾼 보석금도 리더 포인트 안이어야 한다 (생성 때와 같은 규칙)
      const leaderUser = await this.userRepository.findOne({
        where: { id: leader.id },
      });
      assertEnoughPoint(leaderUser, { bail: updateBoard.bail });
    }
    if (
      updateBoard.totalMember != null &&
      updateBoard.totalMember < originBoard.countMember
    )
      throw Error("총 인원 수를 현재 참여 인원보다 적게 바꿀 수 없습니다.");

    // boardImage 확인보다 먼저 지운다 (기존 순서 유지)
    await deleteJoinRows(
      this.dataSource.manager,
      ["board_tags_tag", "board_keywords_keyword", "board_categories_category"],
      "boardId",
      boardId
    );

    if (boardImage && boardImage.url != NO_IMAGE_URL) {
      await this.boardImageRepository.update(
        {
          id: originBoard.boardImage.id,
        },
        {
          url: boardImage.url,
        }
      );
    }

    const tagsResult = await findOrCreateByName(this.tagRepository, tags);
    const keywordsResult = await findOrCreateByName(
      this.keywordRepository,
      keywords
    );
    const categoriesResult = await findOrCreateByName(
      this.categoryRepository,
      categories
    );

    if (!originBoard.status && updateBoard.status) {
      updateBoard.closedAt = toLocalDate();
    }

    const updatedInfo = await this.boardRepository.save({
      ...originBoard,
      ...updateBoard,
      // 성공 처리된 프로젝트는 되돌릴 수 없다 (updateFinish 재실행으로 보상을 다시 받는 것을 막는다)
      isSuccess: originBoard.isSuccess || updateBoard.isSuccess === true,
      tags: tagsResult,
      keywords: keywordsResult,
      categories: categoriesResult,
    });

    return updatedInfo;
  }

  // 리더 본인의 게시글인지 확인한다 (zip 업로드·삭제는 이 확인을 업로드보다 먼저 한다)
  async findOwnedBoard({
    boardId,
    userId,
  }: {
    boardId: string;
    userId: string;
  }) {
    // 값이 비면 TypeORM이 where 조건을 빼 버려 첫 행이 잡히므로 먼저 막는다
    if (!boardId)
      throw new UnprocessableEntityException("존재하지 않는 프로젝트입니다.");
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board)
      throw new UnprocessableEntityException("존재하지 않는 프로젝트입니다.");
    if (!userId || board.leader !== userId)
      throw new ForbiddenException("프로젝트 리더만 할 수 있습니다.");
    return board;
  }

  // projectUrl만 바꾼다 (다른 필드는 updateBoard로만 바꾼다)
  async updateProjectUrl({
    boardId,
    projectUrl,
  }: {
    boardId: string;
    projectUrl: string;
  }) {
    await this.boardRepository.update({ id: boardId }, { projectUrl });
    return projectUrl;
  }

  // 비교식은 그대로 둔다 (update에서는 값이 비어 있을 수 있다)
  private assertBoardRules(board: Partial<CreateBoardInput>) {
    if (board.bail < 50000 || board.bail > 1000000)
      throw Error("보석금이 범위 밖입니다.");
    if (board.totalMember < 1 || board.totalMember > 6)
      throw Error("총 인원 수가 범위 밖입니다.");
    if (board.frequency < 1 || board.frequency > 7)
      throw Error("모임 주기가 범위 밖입니다.");
    if (board.closedAt > board.endAt)
      throw Error("모집 마감일이 프로젝트 시작일보다 빠릅니다.");
  }

  async updateFinish({ boardId, userId }) {
    const userBoard = await this.userBoardRepository.findOne({
      where: { user: { id: userId }, board: { id: boardId } },
    });

    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!userBoard) throw Error("참여한 프로젝트가 아닙니다.");
    if (board.isSuccess) throw Error("이미 완료된 프로젝트입니다.");

    if (board.leader !== userId)
      throw Error("프로젝트 리더만 완료할 수 있습니다.");

    // 출석률 계산
    // 버그 유지: { board } 대신 boardId를 넘겨 여기서 항상 TypeError가 난다
    const attendance = await this.attendanceService.getAllAttendancePercent(
      boardId
    );

    // 출석률이 SUCCESS_ATTENDANCE_PERCENT 이상이면 성공
    const isSuccess = attendance >= SUCCESS_ATTENDANCE_PERCENT;
    const rate = isSuccess ? SUCCESS_REWARD_RATE : FAIL_REWARD_RATE;
    // point·amount는 int 컬럼이므로 소수점 이하는 버린다
    const reward = Math.floor(board.bail * rate);

    await this.boardRepository.update(
      {
        id: boardId,
      },
      {
        isSuccess,
        endAt: toLocalDate(),
      }
    );

    const members = await this.userBoardRepository.find({
      where: { board: { id: boardId }, isAccepted: true },
      relations: ["user", "board"],
    });

    // 유저들에게 보석 지급 (포인트를 모두 반영한 뒤 이력을 저장한다)
    for (const member of members) {
      await this.userRepository.update(
        {
          id: member.user.id,
        },
        {
          point: member.user.point + reward,
        }
      );
    }

    // pointHistory에 저장
    for (const member of members) {
      await this.pointHistoryRepository.save({
        user: member.user,
        amount: reward,
        pointHistory: isSuccess ? "프로젝트 성공 보상" : "프로젝트 실패 보상",
      });
    }

    return isSuccess ? "프로젝트 성공" : "프로젝트 실패";
  }

  async remove({ leader, boardId }) {
    const originBoard = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (originBoard.leader != leader.id)
      throw Error("작성자만 지울 수 있습니다.");

    // softDelete ( id가 아닌 다른 요소로도 삭제 가능 )
    const result = await this.boardRepository.softDelete({ id: boardId });
    return !!result.affected;
  }

  async onClickBoard({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) throw Error("존재하지 않는 게시물입니다.");

    // 출석률을 가지고온다.
    const attendancePercent =
      await this.attendanceService.getAllAttendancePercent({
        board,
      });

    if (attendancePercent < SUCCESS_ATTENDANCE_PERCENT) {
      return `출석률이 ${SUCCESS_ATTENDANCE_PERCENT}% 미만입니다.`;
    }

    // 종료일이 지났는지 확인한다.
    const now = toLocalDate();
    if (board.endAt < now) return "프로젝트를 최종적으로 성공했습니다.";
    return `프로젝트가 종료되지 않았지만, 출석률이 ${SUCCESS_ATTENDANCE_PERCENT}% 이상입니다.`;
  }
}
