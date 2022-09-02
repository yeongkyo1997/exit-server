import { Module } from "@nestjs/common";
import { AuthsService } from "./auths.service";
import { AuthsResolver } from "./auths.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtAccessStrategy } from "src/commons/auth/jwt-access.strategy";
import { User } from "src/users/entities/user.entity";
import { JwtRefreshStrategy } from "src/commons/auth/jwt-refresh.strategy";
import { JwtModule } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { Board } from "src/boards/entities/board.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User, //
      UserImage,
      Tag,
      Board,
      Keyword,
    ]),
  ],
  providers: [
    AuthsResolver,
    AuthsService,
    UsersService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthsModule {}
