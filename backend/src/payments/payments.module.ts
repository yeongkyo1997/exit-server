import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsResolver } from "./payments.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Payment } from "./entities/payment.entity";
import { IamportService } from "src/iamport/iamport.service";

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
