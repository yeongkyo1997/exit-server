import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthUser } from "src/commons/type/context";
import { PointHistory } from "src/point-history/entities/point-history.entity";
import { DataSource, Repository } from "typeorm";
import { IamportService } from "../iamport/iamport.service";
import { User } from "../users/entities/user.entity";
import {
  Payment,
  PAYMENT_TRANSACTION_STATUS_ENUM,
} from "./entities/payment.entity";

// impUid는 아임포트 API 경로에 그대로 들어가므로 정해진 형식만 허용한다
const IMP_UID_PATTERN = /^imp_[0-9]+$/;

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

  async findByUser({ userId }: { userId: string }) {
    // userId가 없으면 TypeORM 0.3.9가 조건을 지워 모든 사용자의 결제를 돌려주므로 먼저 막는다
    if (!userId) throw new UnauthorizedException("로그인하지 않았습니다.");

    return await this.paymentsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
      relations: ["user"],
    });
  }

  async pay({
    impUid,
    amount,
    user,
  }: {
    impUid: string;
    amount: number;
    user: AuthUser;
  }) {
    if (!user?.id) throw new UnauthorizedException("로그인하지 않았습니다.");

    if (!IMP_UID_PATTERN.test(impUid))
      throw new UnprocessableEntityException("잘못된 결제 번호입니다.");

    // 이미 등록된 결제건은 아임포트를 부르기 전에 거부한다 (등록된 결제의 금액이 드러나지 않게)
    const validPayment = await this.findStatus({ impUid });
    if (validPayment) throw new ConflictException("이미 추가된 결제건입니다.");

    const access_Token = await this.iamportService.getToken();

    // 클라이언트가 보낸 금액이 아니라 아임포트에 실제로 결제된 상태와 금액을 기준으로 검증
    const iamportPayment = await this.iamportService.verifyToken({
      accessToken: access_Token,
      impUid,
    });
    if (iamportPayment?.status !== "paid")
      throw new UnprocessableEntityException("결제가 완료되지 않았습니다.");
    // 포인트는 원화 기준이다 (다른 통화 결제가 같은 숫자의 포인트가 되지 않게)
    if (iamportPayment.currency !== "KRW")
      throw new UnprocessableEntityException("지원하지 않는 결제 통화입니다.");
    if (iamportPayment.amount - (iamportPayment.cancel_amount ?? 0) !== amount)
      throw new UnprocessableEntityException("결제 금액이 일치하지 않습니다.");

    return this.create({ impUid, amount, user });
  }

  async cancel({
    impUid,
    amount,
    user,
  }: {
    impUid: string;
    amount: number;
    user: AuthUser;
  }) {
    // 취소 주체는 로그인 사용자다. TypeORM 0.3.9는 undefined where를 지우므로 id가 없으면 바로 거부
    if (!user?.id) throw new UnauthorizedException("로그인하지 않았습니다.");

    if (!IMP_UID_PATTERN.test(impUid))
      throw new UnprocessableEntityException("잘못된 결제 번호입니다.");

    // 본인 결제만 찾는다. 남의 결제도 '없음'으로 응답한다 (결제 존재·금액이 드러나지 않게)
    const payment = await this.paymentsRepository.findOne({
      where: {
        impUid,
        status: PAYMENT_TRANSACTION_STATUS_ENUM.PAYMENT,
        user: { id: user.id },
      },
      relations: ["user"],
    });
    // where에만 기대지 않고 소유자를 한 번 더 비교한다
    if (!payment || payment.user?.id !== user.id)
      throw new UnprocessableEntityException("취소할 결제 내역이 없습니다.");

    // 결제 취소금액이 다르면
    if (payment.amount !== amount)
      throw new ConflictException("취소금액이 다릅니다.");

    // 결제 취소(실제 카드 환불)는 지금 지원하지 않는다.
    // 다시 켤 때는 아임포트 환불(cancelPayment)을 createCancel 트랜잭션 안에서 커밋 직전에 부르고,
    // 응답 없이 실패한 환불은 verifyToken으로 다시 확인한 뒤 정산해야 한다
    throw new UnprocessableEntityException(
      "결제 취소는 현재 지원하지 않습니다."
    );
  }

  async create({
    impUid,
    amount,
    user: _user,
  }: {
    impUid: string;
    amount: number;
    user: AuthUser;
  }) {
    // id가 없으면 아래 findOne이 첫 유저 행을 돌려주므로 먼저 막는다
    if (!_user?.id) throw new UnauthorizedException("로그인하지 않았습니다.");

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

  // 지금은 cancel()이 부르지 않는다 (결제 취소 비활성화). DB 반영만 하며 아임포트 환불은 하지 않는다
  async createCancel({
    impUid,
    amount,
    userId,
  }: {
    impUid: string;
    amount: number;
    userId: string;
  }) {
    // id가 없으면 아래 findOne이 첫 유저 행을 돌려주므로 먼저 막는다
    if (!userId) throw new UnauthorizedException("로그인하지 않았습니다.");

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      // 유저 행을 먼저 잠근다
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: "pessimistic_write" },
      });
      if (!user || user.id !== userId)
        throw new UnprocessableEntityException("존재하지 않는 유저입니다.");

      // 이미 쓴 포인트는 환불하지 않는다 (잔액이 음수가 되지 않게)
      if (user.point < amount)
        throw new UnprocessableEntityException(
          "이미 사용한 포인트는 환불할 수 없습니다."
        );

      // (impUid, status) unique 제약으로 중복 취소를 막는다
      const payment = this.paymentsRepository.create({
        impUid,
        amount: -amount,
        user,
        status: PAYMENT_TRANSACTION_STATUS_ENUM.CANCELLED,
      });

      await queryRunner.manager.save(payment);

      // 포인트 차감은 반드시 같은 queryRunner로 한다
      // (트랜잭션 밖 repository.update는 이 트랜잭션이 잡은 잠금을 기다리다 실패한다)
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

      if (error.code === "ER_DUP_ENTRY")
        throw new ConflictException("이미 결제가 취소되었습니다.");
      // 오류를 삼키지 않는다 (삼키면 반쯤 처리된 취소가 성공처럼 보인다)
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findStatus({ impUid }: { impUid: string }) {
    return await this.paymentsRepository.findOne({
      where: { impUid },
    });
  }
}
