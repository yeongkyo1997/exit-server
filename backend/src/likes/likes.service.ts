import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { Repository, DataSource } from "typeorm";
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
    const result = [];
    for (let i = 0; i < likes.length; i++) {
      const userData = await this.userRepository.findOne({
        where: { id: likes[i]["user"].id },
        relations: ["userImage", "tags", "keywords", "categories"],
      });
      likes[i]["user"]["keywords"] = userData["keywords"];
      likes[i]["user"]["categories"] = userData["categories"];
      likes[i]["user"]["userImage"] = userData["userImage"];
      likes[i]["user"]["tags"] = userData["tags"];

      const boardData = await this.boardRepository.findOne({
        where: { id: likes[i]["board"].id },
        relations: ["boardImage", "tags", "keywords", "categories"],
      });
      likes[i]["board"]["keywords"] = boardData["keywords"];
      likes[i]["board"]["categories"] = boardData["categories"];
      likes[i]["board"]["boardImage"] = boardData["boardImage"];
      likes[i]["board"]["tags"] = boardData["tags"];

      result.push(likes[i]);
    }

    return result;
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
