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
import { Category } from "src/categories/entities/category.entity";
import { AuthController } from "./auth.controller";
import { JwtGoogleStrategy } from "src/commons/auth/jwt-social-google-access.strategy";
import { JwtNaverStrategy } from "src/commons/auth/jwt-social-naver-access.strategy";
import { JwtKakaoStrategy } from "src/commons/auth/jwt-social-kakao-access.strategy";
import { EmailService } from "src/email/email.service";

@Module({
  imports: [
    JwtModule.register({}),
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
    AuthsResolver,
    AuthsService,
    UsersService,
    EmailService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtGoogleStrategy,
    JwtNaverStrategy,
    JwtKakaoStrategy,
  ],
  controllers: [
    AuthController, //
  ],
})
export class AuthsModule {}
