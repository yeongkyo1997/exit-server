import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";

@Injectable()
export class AuthsService {
  constructor(
    private readonly usersService: UsersService, //
    private readonly jwtService: JwtService //
  ) {}

  setRefreshToken({ user, res }) {
    const refreshToken = this.jwtService.sign(
      { email: user.email, sub: user.id },
      { secret: "myRefreshKey", expiresIn: "2w" }
    );
    // 개인개발환경
    // res.setHeader('Set-Cookie', refreshToken=${refreshToken}; path=/;);
    const options = {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      domain: "teamserver05.shop",
      path: "/",
    };

    // 배포환경 (팀프로젝트)
    res.setHeader(
      "Set-Cookie",
      `refreshToken=${refreshToken}; path=/; domain=.teamserver05.shop; SameSite=Node; Secure; HttpOnly;`
    );
    // 프론트 주소로
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  }

  getAccessToken({ user }) {
    return this.jwtService.sign(
      { email: user.email, sub: user.id },
      { secret: "myAccessKey", expiresIn: "1h" }
    );
  }

  async socialLogin(req, res) {
    let user = await this.usersService.findOneWithEmail({
      email: req.user.email,
    });

    if (!user) {
      user = await this.usersService.create({ ...req.user });
    }

    this.setRefreshToken({ user, res });

    res.redirect("http://localhost:5500/frontend/login/index.html");
  }
}
