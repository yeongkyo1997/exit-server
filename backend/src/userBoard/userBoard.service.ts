import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { UserBoard } from "./entities/userBoard.entity";

@Injectable()
export class UserBoardService {
  constructor(
    @InjectRepository(UserBoard)
    private readonly userBoardRepository: Repository<UserBoard>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  //프로젝트를 신청한 유저들(리더 제외) 불러오는 함수
  async findAll({ userId, boardId, isAccepted }) {
    const users = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
        isAccepted,
      },
      relations: ["board", "user"],
    });
    const result = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i]["user"].id !== users[i]["board"].leader) {
        const userData = await this.userRepository.findOne({
          where: { id: users[i]["user"].id },
          relations: ["userImage", "tags", "keywords", "categories"],
        });
        users[i]["user"]["tags"] = userData["tags"];
        users[i]["user"]["keywords"] = userData["keywords"];
        users[i]["user"]["categories"] = userData["categories"];
        users[i]["user"]["userImage"] = userData["userImage"];
        result.push(users[i]);
      }
    }

    return result;
  }

  async create({ userId, createUserBoardInput }) {
    const { boardId } = createUserBoardInput;
    const checkDuplication = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
    });

    if (checkDuplication) throw new Error("이미 신청한 프로젝트입니다.");

    const checkOtherBoard = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        isAccepted: true,
      },
      relations: ["board"],
    });

    const now = new Date(new Intl.DateTimeFormat("kr").format());
    for (let i = 0; checkOtherBoard && i < checkOtherBoard.length; i++) {
      if (checkOtherBoard[i].board === null) continue;
      if (checkOtherBoard[i].board.endAt > now)
        throw Error("이미 진행중인 프로젝트가 있습니다.");
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (user.point < board.bail)
      throw Error("보유 포인트가 보석금보다 적습니다.");

    return await this.userBoardRepository.save({
      user,
      board,
    });
  }

  async update({ requesterId, updateUserBoardInput }) {
    const { isAccepted, boardId, userId } = updateUserBoardInput;

    // 지원자 승인/거절은 프로젝트 리더만 할 수 있다
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) throw new Error("존재하지 않는 프로젝트입니다.");
    if (board.leader !== requesterId)
      throw new ForbiddenException("프로젝트 리더만 승인할 수 있습니다.");

    // 이미 참석한 프로젝트인지 확인
    const checkAccepted = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        board: { id: boardId },
        isAccepted: true,
      },
    });

    // 이미 참석한 프로젝트라면 에러
    if (checkAccepted) {
      return new Error("이미 참석한 프로젝트입니다.");
    }

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
      board: boardInfo,
      user: await this.userRepository.findOne({ where: { id: userId } }),
      isAccepted,
    });
  }

  async removeAll({ requesterId, userId, boardId }) {
    // 본인 지원 내역은 본인이, 그 외에는 해당 프로젝트 리더만 삭제할 수 있다
    if (userId !== requesterId) {
      if (!boardId)
        throw new ForbiddenException(
          "다른 유저의 지원 내역은 삭제할 수 없습니다."
        );
      const board = await this.boardRepository.findOne({
        where: { id: boardId },
      });
      if (!board || board.leader !== requesterId)
        throw new ForbiddenException("프로젝트 리더만 삭제할 수 있습니다.");
    }

    const userBoardData = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });

    if (userBoardData.length == 1 && userBoardData[0].isAccepted) {
      const boardInfo = await this.boardRepository.findOne({
        where: { id: boardId },
      });
      const updateCount = await this.boardRepository.update(
        {
          id: boardId,
        },
        {
          countMember: boardInfo.countMember - 1,
        }
      );
    }

    const showResult = [];
    for (let i = 0; i < userBoardData.length; i++) {
      const result = await this.userBoardRepository.delete({
        id: userBoardData[i].id,
      });
      showResult.push(
        result.affected
          ? `${userBoardData[i].id} deleted`
          : `${userBoardData[i].id} delete failed`
      );
    }

    return showResult;
  }
}
