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

  async setRefreshToken({ user, res }) {
    const refreshToken = this.jwtService.sign(
      { email: user.email, sub: user.id, nickname: user.nickname },
      { secret: "myRefreshKey", expiresIn: "2w" }
    );
    // 개인개발환경
    // res.setHeader('Set-Cookie', refreshToken=${refreshToken}; path=/;);

    // 배포환경 (팀프로젝트)
    await res.setHeader(
      'Set-Cookie',
      `refreshToken=${refreshToken}; path=/; Secure; httpOnly; SameSite=None;`,
    );
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
    }

    this.setRefreshToken({ user, res });

    res.redirect("http://localhost:3000");
  }
}
