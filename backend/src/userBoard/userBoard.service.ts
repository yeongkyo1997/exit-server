import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { DataSource, Repository } from "typeorm";
import { addPoint, deductPoint } from "src/commons/point/point.util";
import { UserBoard } from "./entities/userBoard.entity";

@Injectable()
export class UserBoardService {
  constructor(
    @InjectRepository(UserBoard)
    private readonly userBoardRepository: Repository<UserBoard>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource
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
      throw new Error("이미 참석한 프로젝트입니다.");
    }

    const getId = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });
    if (!getId) throw new Error("신청 내역이 없습니다.");

    // 승인 시 보석금 납부, 인원 증가, 승인 처리를 하나의 트랜잭션으로 처리한다
    return await this.dataSource.transaction(async (manager) => {
      if (isAccepted) {
        if (board.isFinished) throw new Error("이미 완료된 프로젝트입니다.");

        await deductPoint(manager, {
          userId,
          amount: board.bail,
          reason: "보석금 납부",
        });

        // deductPoint가 유저 행을 잠근 뒤에 다시 확인해서, 동시에 승인돼도 한 번만 납부하게 한다
        const current = await manager.findOne(UserBoard, {
          where: { id: getId.id },
        });
        if (current.isAccepted) throw new Error("이미 참석한 프로젝트입니다.");

        await manager.increment(Board, { id: boardId }, "countMember", 1);
      }

      return await manager.save(UserBoard, {
        id: getId.id,
        board: { id: boardId },
        user: getId.user,
        isAccepted,
      });
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

    const showResult = [];
    for (const userBoard of userBoardData) {
      const affected = await this.dataSource.transaction(async (manager) => {
        // 먼저 삭제해서, 같은 신청 건이 동시에 삭제돼도 보석금은 한 번만 반환되게 한다
        const result = await manager.delete(UserBoard, { id: userBoard.id });
        if (!result.affected) return 0;

        // 정산 전인 프로젝트에서 승인된 팀원이 빠지면 보석금을 돌려주고 인원을 줄인다
        if (userBoard.isAccepted && userBoard.board) {
          const board = await manager.findOne(Board, {
            where: { id: userBoard.board.id },
            lock: { mode: "pessimistic_write" },
          });
          if (board && !board.isFinished) {
            await addPoint(manager, {
              userId: userBoard.user.id,
              amount: board.bail,
              reason: "보석금 반환",
            });
            await manager.decrement(Board, { id: board.id }, "countMember", 1);
          }
        }

        return result.affected;
      });

      showResult.push(
        affected ? `${userBoard.id} deleted` : `${userBoard.id} delete failed`
      );
    }

    return showResult;
  }
}
