import { Injectable, UnauthorizedException } from "@nestjs/common";
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
    res.setHeader(
      "Set-Cookie",
      `refreshToken=${refreshToken}; path=/; domain=.mainproject04.shop; httpOnly; SameSite=None; Secure`
    );
  }

  getAccessToken({ user }) {
    return this.jwtService.sign(
      { email: user.email, sub: user.id, nickname: user.nickname },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "1h" }
    );
  }

  async socialLogin({ req, res }) {
    // 이메일이 없으면 어떤 계정으로 로그인시킬지 알 수 없다
    if (!req.user.email)
      throw new UnauthorizedException("이메일 제공 동의가 필요합니다.");

    let user = await this.usersService.findOneByEmail({
      email: req.user.email,
    });

    if (!user) {
      // 소셜 가입자는 비밀번호 로그인을 쓰지 않으므로 추측할 수 없는 임의 값을 저장한다
      const password = await bcrypt.hash(randomBytes(32).toString("hex"), 10.2);

      const createUserInput = req.user;

      createUserInput["userImage"] = {
        url: "null",
      };

      user = await this.usersService.create({
        createUserInput,
        password,
      });
    }

    await this.setRefreshToken({ user, res, req });

    res.redirect("http://localhost:3000");
  }
}
