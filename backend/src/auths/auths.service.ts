import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthsService {
  constructor(
    private readonly usersService: UsersService, //
    private readonly jwtService: JwtService //
  ) {}

  async setRefreshToken({ user, res, req }) {
    const refreshToken = this.jwtService.sign(
      { email: user.email, sub: user.id, nickname: user.nickname },
      { secret: "myRefreshKey", expiresIn: "2w" }
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
      { secret: "myAccessKey", expiresIn: "1h" }
    );
  }

  async socialLogin({ req, res }) {
    const user = await this.usersService.findOneByEmail({
      email: req.user.email,
    });

    if (!user) {
      const password = await bcrypt.hash(req.user.password, 10.2);

      const createUserInput = req.user;

      createUserInput["userImage"] = {
        url: "null",
      };

      await this.usersService.create({
        createUserInput,
        password,
      });
    }

    this.setRefreshToken({ user, res, req });

    res.redirect("http://localhost:3000");
  }
}
