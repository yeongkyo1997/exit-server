import { Module } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { AttendanceResolver } from "./attendance.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { BoardsService } from "src/boards/boards.service";
import { Tag } from "src/tags/entities/tag.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Category } from "src/categories/entities/category.entity";
import { BoardImage } from "src/board-images/entities/board-image.entity";
import { Board } from "src/boards/entities/board.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { User } from "src/users/entities/user.entity";
import { PointHistory } from "src/point-history/entities/point-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      Tag,
      Keyword,
      Category,
      BoardImage,
      Board,
      UserBoard,
      User,
      PointHistory,
    ]),
  ],
  providers: [
    AttendanceService, //
    AttendanceResolver,
    BoardsService,
  ],
})
export class AttendanceModule {}
