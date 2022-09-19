import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { Repository } from "typeorm";
import { Like } from "./entities/like.entity";

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>
  ) {}
  async findAll({ userId, boardId }) {
    return await this.likeRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });
  }

  async create({ userId, boardId }) {
    const isValid = await this.likeRepository.findOne({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });

    const boardInfo = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (isValid) {
      await this.boardRepository.update(
        { id: boardId },
        { countLike: boardInfo.countLike - 1 }
      );
      await this.likeRepository.delete({ id: isValid.id });
      return "찜 취소";
    }

    await this.boardRepository.update(
      { id: boardId },
      { countLike: boardInfo.countLike + 1 }
    );
    await this.likeRepository.save({
      user: userId,
      board: boardId,
    });
    return "찜 등록";
  }
}
