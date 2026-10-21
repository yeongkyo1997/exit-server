import { CACHE_MANAGER, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Cache } from "cache-manager";
import { Strategy } from "passport-jwt";
import {
  fromJwtPayload,
  refreshCookieToken,
  refreshTokenBlacklistKey,
} from "src/commons/auth/token.utils";

export class JwtRefreshStrategy extends PassportStrategy(Strategy, "refresh") {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache //
  ) {
    super({
      jwtFromRequest: (req) => refreshCookieToken(req.headers.cookie),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req, payload) {
    const refreshToken = refreshCookieToken(req.headers.cookie);
    const check = await this.cacheManager.get(
      refreshTokenBlacklistKey(refreshToken)
    );

    if (check) throw new UnauthorizedException();
    return fromJwtPayload(payload);
  }
}
