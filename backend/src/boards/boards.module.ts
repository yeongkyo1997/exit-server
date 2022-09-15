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
// import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { FilesService } from "src/files/files.service";
import { User } from "src/users/entities/user.entity";
import { PointHistory } from "src/point-history/entities/point-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board, //
      Tag,
      Category,
      Keyword,
      UserBoard,
      BoardImage,
      User,
      PointHistory,
    ]),
    // ElasticsearchModule.register({
    //   node: "http://elasticsearch:9200",
    // }),
  ],
  providers: [
    BoardsResolver, //
    BoardsService,
    FilesService,
  ],
})
export class BoardsModule {}
