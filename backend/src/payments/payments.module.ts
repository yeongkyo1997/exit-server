import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsResolver } from "./payments.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { IamportService } from "../iamport/iamport.service";
import { Payment } from "./entities/payment.entity";
import { PointHistory } from "src/point-history/entities/point-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment, //
      User,
      PointHistory,
    ]),
  ],
  providers: [
    IamportService, //
    PaymentsResolver,
    PaymentsService,
  ],
})
export class PaymentsModule {}
