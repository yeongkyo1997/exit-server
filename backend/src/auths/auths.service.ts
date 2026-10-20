import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

@Injectable()
export class AuthsService {
  constructor(
    private readonly usersService: UsersService, //
    private readonly jwtService: JwtService //
  ) {}

  async setRefreshToken({ user, res, req }) {
    const refreshToken = this.jwtService.sign(
      { email: user.email, sub: user.id, nickname: user.nickname },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: "2w" }
    );

    // 배포환경 (팀프로젝트)
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Origin", "https://ex1t.shop");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    const allowedOrigins = "http://localhost:3000,https://ex1t.shop".split(",");
    const origin = req.headers.origin;

    if (allowedOrigins.indexOf(origin) > -1) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Origin, Accept,Access-Control-Requested-Method, Access-Control-Request-Headers"
    );
    // 쿠키 도메인은 배포 환경마다 다르므로 환경변수로 지정한다 (없으면 기존 도메인)
    const cookieDomain = process.env.COOKIE_DOMAIN ?? ".mainproject04.shop";
    res.setHeader(
      "Set-Cookie",
      `refreshToken=${refreshToken}; path=/; domain=${cookieDomain}; httpOnly; SameSite=None; Secure`
    );
  }

  getAccessToken({ user }) {
    return this.jwtService.sign(
      { email: user.email, sub: user.id, nickname: user.nickname },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "1h" }
    );
  }

  async socialLogin({ req, res }) {
    let user = await this.usersService.findOneByEmail({
      email: req.user.email,
    });

    if (!user) {
      // 소셜 가입자는 이메일/비밀번호 로그인을 쓰지 않으므로 추측 불가능한 임의 비밀번호를 저장한다.
      const password = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

      const createUserInput = req.user;

      createUserInput["userImage"] = {
        url: "null",
      };

      user = await this.usersService.create({
        createUserInput,
        password,
      });
    }

    this.setRefreshToken({ user, res, req });

    res.redirect(process.env.FRONTEND_URL ?? "http://localhost:3000");
  }
}
