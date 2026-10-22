import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdatePointHistoryInput } from "./dto/update-point-history.input";
import { PointHistory } from "./entities/point-history.entity";

@Injectable()
export class PointHistoryService {
  constructor(
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>
  ) {}

  async findAll({ userId }: { userId: string }) {
    // userId가 없으면 TypeORM 0.3.9가 조건을 지워 모든 사용자의 내역을 돌려주므로 먼저 막는다
    if (!userId) throw new UnauthorizedException("로그인하지 않았습니다.");

    return await this.pointHistoryRepository.find({
      where: { user: { id: userId } },
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: 5,
    });
  }

  async create({ userId, createPointHistoryInput }) {
    // id가 없으면 주인 없는 내역이 생기므로 막는다
    if (!userId) throw new UnauthorizedException("로그인하지 않았습니다.");

    return await this.pointHistoryRepository.save({
      ...createPointHistoryInput,
      user: userId,
    });
  }

  // 본인 내역만 찾는다. TypeORM 0.3.9는 undefined where를 지우므로 id 두 개를 먼저 확인하고,
  // 소유자는 where에만 기대지 않고 한 번 더 비교한다
  private async findOwned({
    pointHistoryId,
    userId,
  }: {
    pointHistoryId: string;
    userId: string;
  }) {
    if (!userId) throw new UnauthorizedException("로그인하지 않았습니다.");
    if (!pointHistoryId)
      throw new BadRequestException("pointHistoryId가 필요합니다.");

    const history = await this.pointHistoryRepository.findOne({
      where: { id: pointHistoryId, user: { id: userId } },
      relations: ["user"],
    });
    return history?.user?.id === userId ? history : null;
  }

  async update({
    userId,
    updatePointHistoryInput,
    pointHistoryId,
  }: {
    userId: string;
    updatePointHistoryInput: UpdatePointHistoryInput;
    pointHistoryId: string;
  }) {
    // 없거나 남의 내역이면 같은 에러 (다른 사람 내역이 있는지 드러나지 않게)
    const history = await this.findOwned({ pointHistoryId, userId });
    if (!history)
      throw new NotFoundException("수정할 수 있는 포인트 내역이 없습니다.");

    // 고칠 수 있는 값만 옮긴다. null은 NOT NULL 컬럼 오류가 나므로 뺀다
    const patch: Partial<Pick<PointHistory, "pointHistory" | "amount">> = {};
    if (updatePointHistoryInput?.pointHistory != null)
      patch.pointHistory = updatePointHistoryInput.pointHistory;
    if (updatePointHistoryInput?.amount != null)
      patch.amount = updatePointHistoryInput.amount;

    // 찾은 행 위에 덮어쓴다 (없는 id로 새 행이 INSERT되지 않는다)
    return await this.pointHistoryRepository.save({ ...history, ...patch });
  }

  async remove({
    userId,
    pointHistoryId,
  }: {
    userId: string;
    pointHistoryId: string;
  }) {
    // 없거나 남의 내역이면 같은 에러 (다른 사람 내역이 있는지 드러나지 않게)
    const history = await this.findOwned({ pointHistoryId, userId });
    if (!history)
      throw new NotFoundException("삭제할 수 있는 포인트 내역이 없습니다.");

    // 하드 삭제 대신 deletedAt을 채워 기록을 남긴다
    const result = await this.pointHistoryRepository.softDelete({
      id: history.id,
    });
    return !!result.affected;
  }
}
