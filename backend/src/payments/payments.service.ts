import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PointHistory } from "src/point-history/entities/point-history.entity";
import { DataSource, Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import {
  Payment,
  PAYMENT_TRANSACTION_STATUS_ENUM,
} from "./entities/payment.entity";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,

    private readonly datasource: DataSource
  ) {}

  async findByUser({ user }) {
    return await this.paymentsRepository.find({
      where: { user },
      order: { createdAt: "DESC" },
      relations: ["user"],
    });
  }

  async create({ impUid, amount, user: _user }) {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();

    // ================================== transaction 시작 ==========================
    await queryRunner.startTransaction("SERIALIZABLE");
    // =============================================================================

    try {
      // 1. 유저 행을 잠가서 같은 유저의 결제 요청을 직렬화한다
      const user = await queryRunner.manager.findOne(User, {
        where: { id: _user.id },
        lock: { mode: "pessimistic_write" },
      });

      // 2. 동시에 들어온 같은 결제건이 먼저 반영됐는지 잠금 이후에 다시 확인한다
      const duplicated = await queryRunner.manager.findOne(Payment, {
        where: { impUid, status: PAYMENT_TRANSACTION_STATUS_ENUM.PAYMENT },
      });
      if (duplicated) throw new ConflictException("이미 추가된 결제건입니다.");

      // 3. payment 테이블에 거래 기록 한 줄 생성
      const payment = this.paymentsRepository.create({
        impUid,
        amount,
        user: _user,
        status: PAYMENT_TRANSACTION_STATUS_ENUM.PAYMENT,
      });
      await queryRunner.manager.save(payment);

      // 4. 유저의 돈 업데이트
      const updatedUser = this.usersRepository.create({
        ...user,
        point: user.point + amount,
      });

      const createPointHistory = this.pointHistoryRepository.create({
        pointHistory: "포인트 충전",
        amount,
        user: { id: user.id },
      });

      await queryRunner.manager.save(updatedUser);
      await queryRunner.manager.save(createPointHistory);

      // ================================ commit 성공 확정 ==========================
      await queryRunner.commitTransaction();
      // ==========================================================================

      // 5. 최종 결과 프론트엔드에 돌려주기
      return payment;
    } catch (error) {
      // ================================== rollback 되돌리기 =======================
      await queryRunner.rollbackTransaction();
      // ==========================================================================
      throw error;
    } finally {
      // ================================== 연결 해제 ===============================
      await queryRunner.release();
      // ==========================================================================
    }
  }

  async createCancel({ impUid, amount, user: _user, cancelPayment }) {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      // 모든 조회/수정은 같은 트랜잭션(queryRunner) 안에서 처리한다
      const user = await queryRunner.manager.findOne(User, {
        where: { id: _user.id },
        lock: { mode: "pessimistic_write" },
      });

      const canceled = await queryRunner.manager.findOne(Payment, {
        where: { impUid, status: PAYMENT_TRANSACTION_STATUS_ENUM.CANCELLED },
      });
      if (canceled) throw new ConflictException("이미 결제가 취소되었습니다.");

      // 충전한 포인트를 이미 사용했다면 환불할 수 없다
      if (user.point < amount)
        throw new UnprocessableEntityException(
          "보유 포인트가 환불 금액보다 적습니다."
        );

      const payment = this.paymentsRepository.create({
        impUid,
        amount: -amount,
        user: { id: user.id },
        status: PAYMENT_TRANSACTION_STATUS_ENUM.CANCELLED,
      });

      const updatedUser = this.usersRepository.create({
        ...user,
        point: user.point - amount,
      });

      const createPointHistory = this.pointHistoryRepository.create({
        pointHistory: "포인트 환불",
        amount,
        user: { id: user.id },
      });

      await queryRunner.manager.save(payment);
      await queryRunner.manager.save(updatedUser);
      await queryRunner.manager.save(createPointHistory);

      // 아임포트 환불이 실패하면 예외가 발생해 위 변경사항이 모두 롤백된다
      await cancelPayment();

      await queryRunner.commitTransaction();

      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findStatus({
    impUid,
    status,
  }: {
    impUid: string;
    status?: PAYMENT_TRANSACTION_STATUS_ENUM;
  }) {
    return await this.paymentsRepository.findOne({
      where: { impUid, status },
      relations: ["user"],
    });
  }
}
