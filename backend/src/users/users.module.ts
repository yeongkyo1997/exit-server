import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { Board } from "src/boards/entities/board.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { JwtAccessStrategy } from "src/commons/auth/jwt-access.strategy";
import { Category } from "src/categories/entities/category.entity";
import { EmailService } from "src/email/email.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, //
      UserImage,
      Tag,
      Board,
      Keyword,
      Category,
    ]),
  ],
  providers: [
    UsersResolver, //
    UsersService,
    JwtAccessStrategy,
    EmailService,
  ],
})
export class UsersModule {}
