import { Module } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { AttendanceResolver } from "./attendance.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { Board } from "src/boards/entities/board.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { User } from "src/users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, UserBoard, Board, User])],
  providers: [
    AttendanceService, //
    AttendanceResolver,
  ],
  exports: [AttendanceService],
})
export class AttendanceModule {}
