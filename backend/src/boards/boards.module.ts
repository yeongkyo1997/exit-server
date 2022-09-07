import { Module } from "@nestjs/common";
import { BoardsService } from "./boards.service";
import { BoardsResolver } from "./boards.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Board } from "./entities/board.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Category } from "src/categories/entities/category.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { BoardImage } from "src/board-images/entities/board-image.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board, //
      Tag,
      Keyword,
      Category,
      UserBoard,
      BoardImage
    ]),
  ],
  providers: [
    BoardsResolver, //
    BoardsService,
  ],
})
export class BoardsModule {}
