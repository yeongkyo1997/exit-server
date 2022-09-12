import { ConflictException, Injectable } from "@nestjs/common";
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
    // 개인개발환경
    res.setHeader("Set-Cookie", `refreshToken=${refreshToken}; path=/;`);

    // 배포환경 (팀프로젝트)
    // res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
    // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    // res.setHeader("Access-Control-Allow-Credentials", "true");
    // res.setHeader(
    //   "Access-Control-Allow-Methods",
    //   "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    // );

    // res.setHeader(
    //   "Access-Control-Allow-Headers",
    //   "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Origin, Accept,Access-Control-Requested-Method, Access-Control-Request-Headers"
    // );
    // res.setHeader(
    //   "Set-Cookie",
    //   `refreshToken=${refreshToken}; path=/; domain=.teamserver05.shop; httpOnly; SameSite=None; Secure`
    // );
  }

  getAccessToken({ user }) {
    return this.jwtService.sign(
      { email: user.email, sub: user.id, nickname: user.nickname },
      { secret: "myAccessKey", expiresIn: "1h" }
    );
  }

  async socialLogin({ req, res }) {
    let user = await this.usersService.findOneWithEmail({
      email: req.user.email,
    });
    const password = await bcrypt.hash(req.user.password, 10.2);
    const createUserInput = req.user;
    if (!user) {
      user = await this.usersService.create({
        password,
        createUserInput,
      });
    } else {
      throw new ConflictException("이미 존재하는 이메일입니다.");
    }

    this.setRefreshToken({ user, res, req });

    res.redirect("http://localhost:3000");
  }
}
