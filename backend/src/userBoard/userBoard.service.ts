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
    const Infos = await this.userBoardRepository.find({
      relations: ["board", "user"],
    });
    let result;
    if (isAccepted != undefined) {
      if (userId != undefined && boardId != undefined) {
        result = Infos.filter((ele) => {
          return (
            ele.board.id == boardId &&
            ele.user.id == userId &&
            ele.isAccepted == isAccepted
          );
        });
      } else if (userId != undefined && boardId == undefined) {
        result = Infos.filter((ele) => {
          return ele.user.id == userId && ele.isAccepted == isAccepted;
        });
      } else if (userId == undefined && boardId != undefined) {
        result = Infos.filter((ele) => {
          return ele.board.id == boardId && ele.isAccepted == isAccepted;
        });
      } else {
        result = Infos.filter((ele) => ele.isAccepted == isAccepted);
      }
    } else {
      if (userId != undefined && boardId != undefined) {
        result = Infos.filter((ele) => {
          return ele.board.id == boardId && ele.user.id == userId;
        });
      } else if (userId != undefined && boardId == undefined) {
        result = Infos.filter((ele) => {
          return ele.user.id == userId;
        });
      } else if (userId == undefined && boardId != undefined) {
        result = Infos.filter((ele) => {
          return ele.board.id == boardId;
        });
      } else return Infos;
    }

    return result;
  }

  //findOne({ userId, boardId }) {}

  async create({ createUserBoardInput }) {
    return await this.userBoardRepository.save({
      user: createUserBoardInput.userId,
      board: createUserBoardInput.boardId,
    });
  }

  async update({ updateUserBoardInput }) {
    const { isAccepted, boardId, userId } = updateUserBoardInput;
    const getId = await this.findAll({
      boardId,
      userId,
      isAccepted: undefined,
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
      id: getId[0].id,
      board: boardId,
      user: userId,
      isAccepted,
    });
  }

  async removeAll({ userId, boardId }) {
    if (userId != undefined) {
      const getUserList = await this.findAll({
        userId,
        boardId,
        isAccepted: undefined,
      });

      for (let i = 0; i < getUserList.length; i++) {
        await this.userBoardRepository.softDelete({
          id: getUserList[i].id,
        });
      }
      return true;
    } else {
      const getBoardList = await this.findAll({
        userId,
        boardId,
        isAccepted: undefined,
      });

      for (let i = 0; i < getBoardList.length; i++) {
        await this.userBoardRepository.softDelete({
          id: getBoardList[i].id,
        });
      }
      return true;
    }
  }
}
