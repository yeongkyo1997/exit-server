import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { USER_RELATIONS } from "src/commons/relations";
import { User } from "src/users/entities/user.entity";
import { In, Repository } from "typeorm";
import { UserBoard } from "./entities/userBoard.entity";
import { assertEnoughPoint, assertNoOngoingProject } from "./userBoard.rules";

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
    const userBoards = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
        isAccepted,
      },
      relations: ["board", "user"],
    });

    // 행 순서대로 user.id, board.leader를 읽어 soft-delete된 유저·보드면 지금처럼 TypeError
    const members = userBoards.filter(
      (userBoard) => userBoard.user.id !== userBoard.board.leader
    );
    if (!members.length) return members;

    const users = await this.userRepository.find({
      where: { id: In([...new Set(members.map((member) => member.user.id))]) },
      relations: USER_RELATIONS,
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    for (const member of members) {
      const userData = userMap.get(member.user.id);
      member.user.tags = userData.tags;
      member.user.keywords = userData.keywords;
      member.user.categories = userData.categories;
      member.user.userImage = userData.userImage;
    }

    return members;
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

    await assertNoOngoingProject(this.userBoardRepository, userId);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    assertEnoughPoint(user, board);

    return await this.userBoardRepository.save({
      user,
      board,
    });
  }

  async update({ updateUserBoardInput }) {
    const { isAccepted, boardId, userId } = updateUserBoardInput;

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
    // boardId가 없으면 where 조건이 빠져 모든 프로젝트의 신청 내역이 지워진다
    if (!boardId) throw new BadRequestException("boardId가 필요합니다.");

    const boardInfo = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!boardInfo)
      throw new NotFoundException("존재하지 않는 프로젝트입니다.");

    // 리더는 멤버를(userId를 생략하면 전체를) 내보낼 수 있고, 그 외에는 본인 신청만 취소할 수 있다
    if (boardInfo.leader !== requesterId && userId !== requesterId)
      throw new ForbiddenException(
        "본인의 신청이거나 프로젝트 리더일 때만 삭제할 수 있습니다."
      );

    const userBoardData = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardInfo.id },
      },
      relations: ["board", "user"],
    });

    if (userBoardData.length == 1 && userBoardData[0].isAccepted) {
      await this.boardRepository.update(
        {
          id: boardInfo.id,
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
