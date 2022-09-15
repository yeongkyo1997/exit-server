import { Module } from "@nestjs/common";
import { PointHistoryService } from "./point-history.service";
import { PointHistoryResolver } from "./point-history.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointHistory } from "./entities/point-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PointHistory, //
    ]),
  ],
  providers: [
    PointHistoryResolver, //
    PointHistoryService,
  ],
})
export class PointHistoryModule {}
