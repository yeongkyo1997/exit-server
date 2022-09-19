import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { Like } from "./entities/like.entity";

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
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
