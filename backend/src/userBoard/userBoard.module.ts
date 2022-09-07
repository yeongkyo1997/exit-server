import { Module } from "@nestjs/common";
import { UserBoardService } from "./userBoard.service";
import { UserBoardResolver } from "./userBoard.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserBoard } from "./entities/userBoard.entity";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserBoard, //
      Board,
      User, //
      UserImage,
      Tag,
      Keyword,
    ]),
  ],
  providers: [
    UserBoardResolver, //
    UserBoardService,
  ],
})
export class UserBoardModule {}
