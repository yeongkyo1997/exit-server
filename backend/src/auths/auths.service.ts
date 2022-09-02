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
    res.setHeader("Set-Cookie", `refreshToken=${refreshToken}`);
  }

  getAccessToken({ user }) {
    return this.jwtService.sign(
      { email: user.email, sub: user.id },
      { secret: "myAccessKey", expiresIn: "1h" }
    );
  }

  async socialLogin(req, res) {
    let user = await this.usersService.findOneWithEmail({ email: req.user.email });

    if (!user) {
      user = await this.usersService.create({ ...req.user });
    }

    this.setRefreshToken({ user, res });

    res.redirect("http://localhost:5500/frontend/login/index.html");
  }
}
