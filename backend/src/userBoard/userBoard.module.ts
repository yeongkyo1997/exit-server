import { Module } from "@nestjs/common";
import { UserBoardService } from "./userBoard.service";
import { UserBoardResolver } from "./userBoard.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserBoard } from "./entities/userBoard.entity";
import { Board } from "src/boards/entities/board.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserBoard, //
      Board,
    ]),
  ],
  providers: [
    UserBoardResolver, //
    UserBoardService,
  ],
})
export class UserBoardModule {}
