import { toLocalDate } from "src/commons/utils/date";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { UserBoard } from "./entities/userBoard.entity";

// 종료일이 지나지 않은 프로젝트에 이미 참여 중이면 에러
export async function assertNoOngoingProject(
  userBoardRepository: Repository<UserBoard>,
  userId: string
) {
  const userBoards = await userBoardRepository.find({
    where: {
      user: { id: userId },
      isAccepted: true,
    },
    relations: ["board"],
  });

  const now = toLocalDate();
  for (const { board } of userBoards) {
    if (board === null) continue;
    if (board.endAt > now) throw Error("이미 진행중인 프로젝트가 있습니다.");
  }
}

export function assertEnoughPoint(user: User, board: { bail: number }) {
  if (user.point < board.bail)
    throw Error("보유 포인트가 보석금보다 적습니다.");
}
