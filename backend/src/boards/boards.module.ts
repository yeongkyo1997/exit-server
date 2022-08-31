import { Module } from "@nestjs/common";
import { BoardsService } from "./boards.service";
import { BoardsResolver } from "./boards.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Board } from "./entities/board.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board, //
    ]),
  ],
  providers: [BoardsResolver, BoardsService],
})
export class BoardsModule {}
