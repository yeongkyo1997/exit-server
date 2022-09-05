import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsResolver } from "./payments.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { IamportService } from "../iamport/iamport.service";
import { Payment } from "./entities/payment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment, //
      User,
    ]),
  ],
  providers: [
    IamportService, //
    PaymentsResolver,
    PaymentsService,
  ],
})
export class PaymentsModule {}
