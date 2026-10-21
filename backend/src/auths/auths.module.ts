import { Module } from "@nestjs/common";
import { AuthsService } from "./auths.service";
import { AuthsResolver } from "./auths.resolver";
import { JwtAccessStrategy } from "src/commons/auth/jwt-access.strategy";
import { JwtRefreshStrategy } from "src/commons/auth/jwt-refresh.strategy";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { JwtGoogleStrategy } from "src/commons/auth/jwt-social-google-access.strategy";
import { JwtNaverStrategy } from "src/commons/auth/jwt-social-naver-access.strategy";
import { JwtKakaoStrategy } from "src/commons/auth/jwt-social-kakao-access.strategy";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    JwtModule.register({}), //
    UsersModule,
  ],
  providers: [
    AuthsResolver,
    AuthsService,
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
