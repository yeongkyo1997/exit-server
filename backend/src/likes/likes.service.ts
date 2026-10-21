import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { BOARD_RELATIONS, USER_RELATIONS } from "src/commons/relations";
import { User } from "src/users/entities/user.entity";
import { Repository, DataSource, In } from "typeorm";
import { Like } from "./entities/like.entity";

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource
  ) {}
  async findAll({ userId, boardId }) {
    const likes = await this.likeRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });

    // 행마다 user.id → board.id 순서로 읽어 soft-delete된 유저·보드면 지금처럼 TypeError
    const userIds = [];
    const boardIds = [];
    for (const like of likes) {
      userIds.push(like.user.id);
      boardIds.push(like.board.id);
    }

    const users = userIds.length
      ? await this.userRepository.find({
          where: { id: In([...new Set(userIds)]) },
          relations: USER_RELATIONS,
        })
      : [];
    const boards = boardIds.length
      ? await this.boardRepository.find({
          where: { id: In([...new Set(boardIds)]) },
          relations: BOARD_RELATIONS,
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));
    const boardMap = new Map(boards.map((board) => [board.id, board]));

    for (const like of likes) {
      const userData = userMap.get(like.user.id);
      like.user.keywords = userData.keywords;
      like.user.categories = userData.categories;
      like.user.userImage = userData.userImage;
      like.user.tags = userData.tags;

      const boardData = boardMap.get(like.board.id);
      like.board.keywords = boardData.keywords;
      like.board.categories = boardData.categories;
      like.board.boardImage = boardData.boardImage;
      like.board.tags = boardData.tags;
    }

    return likes;
  }

  async create({ userId, boardId }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // ============================================================ transaction 시작!============================================================
    await queryRunner.startTransaction("SERIALIZABLE");
    // ===========================================================================================================================================

    try {
      const isValid = await queryRunner.manager.findOne(Like, {
        where: { user: { id: userId }, board: { id: boardId } },
        relations: ["board", "user"],
        lock: { mode: "pessimistic_write" },
      });

      const boardInfo = await queryRunner.manager.findOne(Board, {
        where: { id: boardId },
        //lock: {mode: 'pessimistic_write'} ?
      });

      if (isValid) {
        await queryRunner.manager.update(Board, boardId, {
          countLike: boardInfo.countLike - 1,
        });
        await queryRunner.manager.delete(Like, isValid.id);
        await queryRunner.commitTransaction();

        return "찜 취소";
      }
      await queryRunner.manager.update(Board, boardId, {
        countLike: boardInfo.countLike + 1,
      });
      const like = this.likeRepository.create({ user: userId, board: boardId });
      await queryRunner.manager.save(like);

      // ============================================================commit 성공 확정! ===========================================================
      await queryRunner.commitTransaction();
      // ===========================================================================================================================================

      return "찜 등록";
    } catch (eror) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
