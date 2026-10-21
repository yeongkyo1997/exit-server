import {
  DeepPartial,
  EntityManager,
  FindOptionsWhere,
  Repository,
} from "typeorm";

// 이름으로 찾고 없으면 만든다. 같은 이름이 두 번 들어와도 한 행만 생기도록 순서대로 처리한다.
export async function findOrCreateByName<T extends { name: string }>(
  repository: Repository<T>,
  names: string[]
): Promise<T[]> {
  const result: T[] = [];
  for (const name of names ?? []) {
    const found = await repository.findOne({
      where: { name } as FindOptionsWhere<T>,
    });
    result.push(found ?? (await repository.save({ name } as DeepPartial<T>)));
  }
  return result;
}

// 다대다 join 테이블들에서 해당 id의 행을 테이블 순서대로 지운다
export async function deleteJoinRows(
  manager: EntityManager,
  tables: string[],
  column: "boardId" | "userId",
  id: string
) {
  for (const table of tables)
    await manager
      .createQueryBuilder()
      .delete()
      .from(table)
      .where(`${column} = :id`, { id })
      .execute();
}
