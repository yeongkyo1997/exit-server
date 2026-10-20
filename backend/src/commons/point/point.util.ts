import { EntityManager } from "typeorm";
import { PointHistory } from "src/point-history/entities/point-history.entity";
import { User } from "src/users/entities/user.entity";

// 포인트 변경은 반드시 트랜잭션(manager) 안에서 호출한다.
// 잔액은 DB에서 원자적으로 증감하고, 같은 트랜잭션에서 포인트 내역을 남긴다.

// 보석금처럼 포인트를 차감한다. 잔액이 부족하면 에러를 던진다.
export async function deductPoint(
  manager: EntityManager,
  { userId, amount, reason }: { userId: string; amount: number; reason: string }
) {
  const user = await manager.findOne(User, {
    where: { id: userId },
    lock: { mode: "pessimistic_write" },
  });
  if (!user) throw new Error("존재하지 않는 유저입니다.");
  if (user.point < amount)
    throw new Error("보유 포인트가 보석금보다 적습니다.");

  await manager.decrement(User, { id: userId }, "point", amount);
  await manager.save(PointHistory, {
    pointHistory: reason,
    amount,
    user: { id: userId },
  });
}

// 보석금 반환이나 보상처럼 포인트를 지급한다.
export async function addPoint(
  manager: EntityManager,
  { userId, amount, reason }: { userId: string; amount: number; reason: string }
) {
  await manager.increment(User, { id: userId }, "point", amount);
  await manager.save(PointHistory, {
    pointHistory: reason,
    amount,
    user: { id: userId },
  });
}
