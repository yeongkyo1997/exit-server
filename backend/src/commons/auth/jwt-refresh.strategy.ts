import { CACHE_MANAGER, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Cache } from "cache-manager";
import { Strategy } from "passport-jwt";
import { getRefreshToken } from "./cookie";

export class JwtRefreshStrategy extends PassportStrategy(Strategy, "refresh") {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache //
  ) {
    super({
      jwtFromRequest: (req) => getRefreshToken(req.headers.cookie),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req, payload) {
    const refreshToken = getRefreshToken(req.headers.cookie);
    const check = await this.cacheManager.get(`refreshToken:${refreshToken}`);

    if (check) throw new UnauthorizedException();
    return {
      email: payload.email,
      id: payload.sub,
      nickname: payload.nickname,
    };
  }
}
