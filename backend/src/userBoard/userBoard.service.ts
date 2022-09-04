import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { Repository } from "typeorm";
import { UserBoard } from "./entities/userBoard.entity";

@Injectable()
export class UserBoardService {
  constructor(
    @InjectRepository(UserBoard)
    private readonly userBoardRepository: Repository<UserBoard>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>
  ) {}

  async findAll({ userId, boardId, isAccepted }) {
    return await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
        isAccepted,
      },
      relations: ["board", "user"],
    });
  }

  async create({ createUserBoardInput }) {
    return await this.userBoardRepository.save({
      user: createUserBoardInput.userId,
      board: createUserBoardInput.boardId,
    });
  }

  async update({ updateUserBoardInput }) {
    const { isAccepted, boardId, userId } = updateUserBoardInput;
    const getId = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });

    const boardInfo = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (isAccepted) {
      await this.boardRepository.save({
        ...boardInfo,
        countMember: boardInfo.countMember + 1,
      });
    }

    return await this.userBoardRepository.save({
      id: getId.id,
      isAccepted,
    });
  }

  async removeAll({ userId, boardId }) {
    const userBoardData = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });

    const showResult = [];
    for (let i = 0; i < userBoardData.length; i++) {
      const result = await this.userBoardRepository.softDelete({
        id: userBoardData[i].id,
      });
      showResult.push(
        result.affected
          ? `userId ${userBoardData[i].id} deleted`
          : `userId ${userBoardData[i].id} delete failed`
      );
    }

    return showResult;
  }
}
