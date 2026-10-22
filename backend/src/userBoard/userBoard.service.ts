import {
  BadRequestException,
  ConflictException,
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

  // 게시글 리더가 신청자를 수락한다 (거절·내보내기는 removeUserBoards)
  async update({ requesterId, updateUserBoardInput }) {
    const { isAccepted, boardId, userId } = updateUserBoardInput;

    // 값이 비면 TypeORM이 where 조건을 빼 버려 엉뚱한 행이 잡히므로 먼저 막는다
    if (!boardId || !userId)
      throw new BadRequestException("boardId와 userId가 필요합니다.");

    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) throw new NotFoundException("존재하지 않는 프로젝트입니다.");
    if (!requesterId || board.leader !== requesterId)
      throw new ForbiddenException(
        "프로젝트 리더만 신청을 처리할 수 있습니다."
      );

    const application = await this.userBoardRepository.findOne({
      where: { user: { id: userId }, board: { id: boardId } },
      relations: ["board", "user"],
    });
    if (!application) throw new NotFoundException("신청 내역이 없습니다.");
    if (application.isAccepted)
      throw new ConflictException("이미 참석한 프로젝트입니다.");

    // 수락이 아니면 바꿀 것이 없다
    if (!isAccepted) return application;

    if (board.countMember >= board.totalMember)
      throw new BadRequestException("모집 인원이 가득 찼습니다.");
    await assertNoOngoingProject(this.userBoardRepository, userId);

    // 정원 안에서만 인원을 늘린다 (동시에 여러 명을 수락해도 totalMember를 넘지 않게)
    const increased = await this.boardRepository
      .createQueryBuilder()
      .update(Board)
      .set({ countMember: () => "countMember + 1" })
      .where("id = :id AND countMember < totalMember", { id: boardId })
      .execute();
    if (!increased.affected)
      throw new BadRequestException("모집 인원이 가득 찼습니다.");

    // 같은 신청이 동시에 두 번 수락돼도 한 번만 반영되도록 아직 미수락인 행만 바꾼다
    const accepted = await this.userBoardRepository.update(
      { id: application.id, isAccepted: false },
      { isAccepted: true }
    );
    if (!accepted.affected) {
      await this.boardRepository.decrement({ id: boardId }, "countMember", 1);
      throw new ConflictException("이미 참석한 프로젝트입니다.");
    }

    // UserBoard의 board/user는 non-null 필드라 관계를 붙여 다시 조회해 돌려준다
    return this.userBoardRepository.findOne({
      where: { id: application.id },
      relations: ["board", "user"],
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
