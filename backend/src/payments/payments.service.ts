import {
  Injectable,
  ConflictException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Connection, Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import "dotenv/config";
import { IamportService } from "../iamport/iamport.service";
import {
  Payment,
  PAYMENT_TRANSACTION_STATUS_ENUM,
} from "./entities/payment.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly iamportService: IamportService,

    private readonly connection: Connection
  ) {}

  // 결제 내역 생성
  async create({ user: _user, amount, impUid }) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect(); // 연결

    await queryRunner.startTransaction("SERIALIZABLE"); // 트랜잭션 시작
    try {
      const payment = this.paymentRepository.create({
        impUid,
        amount,
        user: _user,
        status: PAYMENT_TRANSACTION_STATUS_ENUM.PAYMENT,
      });

      await queryRunner.manager.save(payment);

      const user = await queryRunner.manager.findOne(User, {
        where: { id: _user.id },
        lock: { mode: "pessimistic_write" },
      });

      const updateUser = this.userRepository.create({
        ...user,
        point: user.point + amount,
      });

      await queryRunner.manager.save(updateUser); // 업데이트

      await queryRunner.commitTransaction(); // 트랜잭션 커밋

      return payment;
    } catch (err) {
      await queryRunner.rollbackTransaction(); // 트랜잭션 롤백
      throw err;
    } finally {
      await queryRunner.release(); // 연결 해제
    }
  }

  // 결제 취소
  async cancel({ impUid, user }) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect(); // 연결
    await queryRunner.startTransaction("SERIALIZABLE"); // 트랜잭션 시작

    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { impUid, user: user.id },
        lock: { mode: "pessimistic_write" },
      });

      const accessToken = await this.iamportService.getToken();
      const checkPayment = await this.iamportService.verifyToken({
        impUid,
        accessToken,
      });

      if (checkPayment.status === "cancelled") {
        throw new UnprocessableEntityException("이미 취소된 거래입니다.");
      }

      const { id, ...rest } = { ...payment };

      const updatePayment = this.paymentRepository.create({
        ...rest,
        status: PAYMENT_TRANSACTION_STATUS_ENUM.CANCELLED,
        amount: -payment.amount,
        user: user,
      });
      await queryRunner.manager.save(updatePayment); // 업데이트

      const _user = await queryRunner.manager.findOne(User, {
        where: { id: user.id },
        lock: { mode: "pessimistic_write" },
      });

      const point = _user.point - payment.amount;

      const updateUser = this.userRepository.create({
        ..._user,
        point,
      });
      await queryRunner.manager.save(updateUser); // 업데이트

      await this.iamportService.cancel({ impUid, accessToken });

      await queryRunner.commitTransaction(); // 트랜잭션 커밋
      return payment;
    } catch (err) {
      await queryRunner.rollbackTransaction(); // 트랜잭션 롤백
      throw new UnprocessableEntityException("결제 취소에 실패했습니다.");
    } finally {
      await queryRunner.release(); // 연결 해제
    }
  }

  // 결제 완료 체크
  async checkPaid({ user, impUid }) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect(); // 연결
    try {
      const checkPayment = await queryRunner.manager.findOne(Payment, {
        where: { user: user, impUid },
      });

      if (checkPayment) {
        throw new ConflictException("이미 결제된 거래입니다.");
      }

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction(); // 트랜잭션 롤백
      throw err;
    } finally {
      await queryRunner.release(); // 연결 해제
    }
  }
}
