import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PointHistory } from "src/point-history/entities/point-history.entity";
import { DataSource, Repository } from "typeorm";
import { IamportService } from "../iamport/iamport.service";
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

    private readonly datasource: DataSource,

    private readonly iamportService: IamportService
  ) {}

  async findByUser({ user }) {
    return await this.paymentsRepository.find({
      where: { user },
      order: { createdAt: "DESC" },
      relations: ["user"],
    });
  }

  async pay({ impUid, amount, user }) {
    // impUid는 아임포트 API 경로에 그대로 들어가므로 정해진 형식만 허용한다
    if (!/^imp_[0-9]+$/.test(impUid))
      throw new UnprocessableEntityException("잘못된 결제 번호입니다.");

    const access_Token = await this.iamportService.getToken();

    // 클라이언트가 보낸 금액이 아니라 아임포트에 실제로 결제된 상태와 금액을 기준으로 검증
    const iamportPayment = await this.iamportService.verifyToken({
      accessToken: access_Token,
      impUid,
    });
    if (iamportPayment?.status !== "paid")
      throw new UnprocessableEntityException("결제가 완료되지 않았습니다.");
    if (iamportPayment.amount - (iamportPayment.cancel_amount ?? 0) !== amount)
      throw new UnprocessableEntityException("결제 금액이 일치하지 않습니다.");

    const validPayment = await this.findStatus({ impUid });
    if (validPayment) throw new ConflictException("이미 추가된 결제건입니다.");

    return this.create({ impUid, amount, user });
  }

  async cancel({ impUid, amount, user }) {
    const paymentInf = await this.findStatus({ impUid });
    if (!paymentInf)
      throw new UnprocessableEntityException("취소할 결제 내역이 없습니다.");

    // 결제 취소금액이 다르면
    if (paymentInf.amount !== amount)
      throw new ConflictException("취소금액이 다릅니다.");

    const accessToken = await this.iamportService.getToken();

    const validCancel = await this.iamportService.verifyToken({
      accessToken,
      impUid,
    });

    // 버그 유지: verifyToken이 이미 data.response를 반환하므로 여기서 TypeError가 난다
    if (validCancel.data.response.status === "cancelled")
      throw new ConflictException("이미 결제가 취소되었습니다.");

    await this.iamportService.cancelPayment({
      accessToken,
      impUid,
    });

    return this.createCancel({
      impUid,
      amount,
      user,
    });
  }

  async create({ impUid, amount, user: _user }) {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      // 1. payment 테이블에 거래 기록 한 줄 생성
      const payment = this.paymentsRepository.create({
        impUid,
        amount,
        user: _user,
        status: PAYMENT_TRANSACTION_STATUS_ENUM.PAYMENT,
      });

      // 트랜잭션에 묶이려면 queryRunner를 통해서 저장해야 한다
      await queryRunner.manager.save(payment);

      // 2. 유저의 돈 찾아오기
      const user = await queryRunner.manager.findOne(User, {
        where: { id: _user.id },
        lock: { mode: "pessimistic_write" },
      });

      // 3. 유저의 돈 업데이트
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

      await queryRunner.commitTransaction();

      // 4. 최종 결과 프론트엔드에 돌려주기
      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // 같은 결제건이 동시에 들어오면 (impUid, status) unique 제약에 걸린다
      if (error.code === "ER_DUP_ENTRY")
        throw new ConflictException("이미 추가된 결제건입니다.");
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createCancel({ impUid, amount, user: _user }) {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const payment = this.paymentsRepository.create({
        impUid,
        amount: -amount,
        user: _user,
        status: PAYMENT_TRANSACTION_STATUS_ENUM.CANCELLED,
      });

      await queryRunner.manager.save(payment);

      const user = await queryRunner.manager.findOne(User, {
        where: { id: _user.id },
        lock: { mode: "pessimistic_write" },
      });

      // 기존 동작 유지: 이 update는 트랜잭션 밖에서 실행된다
      await this.usersRepository.update(
        { id: _user.id },
        { point: user.point - amount }
      );

      const updatedUser = this.usersRepository.create({
        ...user,
        point: user.point - amount,
      });

      const createPointHistory = this.pointHistoryRepository.create({
        pointHistory: "포인트 환불",
        amount,
        user: { id: user.id },
      });

      await queryRunner.manager.save(updatedUser);
      await queryRunner.manager.save(createPointHistory);

      await queryRunner.commitTransaction();

      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async findStatus({ impUid }) {
    return await this.paymentsRepository.findOne({
      where: { impUid },
    });
  }
}
