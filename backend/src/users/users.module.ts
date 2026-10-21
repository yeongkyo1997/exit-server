import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Category } from "src/categories/entities/category.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, //
      UserBoard,
      UserImage,
      Tag,
      Keyword,
      Category,
    ]),
  ],
  providers: [
    UsersResolver, //
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
