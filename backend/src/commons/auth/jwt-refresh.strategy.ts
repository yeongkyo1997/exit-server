import { CACHE_MANAGER, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Cache } from "cache-manager";
import { Request } from "express";
import { Strategy } from "passport-jwt";
import {
  fromJwtPayload,
  hasSubject,
  isRefreshTokenBlacklisted,
  isRevokedForUser,
  refreshCookieToken,
} from "src/commons/auth/token.utils";

export class JwtRefreshStrategy extends PassportStrategy(Strategy, "refresh") {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache //
  ) {
    super({
      // Cookie 헤더가 없거나 refreshToken 쿠키가 없으면 null → 401 (예전에는 TypeError로 500)
      jwtFromRequest: (req: Request) => refreshCookieToken(req.headers.cookie),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload) {
    const refreshToken = refreshCookieToken(req.headers.cookie);
    if (!refreshToken || !hasSubject(payload))
      throw new UnauthorizedException();

    // 로그아웃한 토큰
    if (await isRefreshTokenBlacklisted(this.cacheManager, refreshToken))
      throw new UnauthorizedException();

    // 탈퇴·비밀번호 변경·재발급 전에 발급된 토큰
    if (await isRevokedForUser(this.cacheManager, payload))
      throw new UnauthorizedException();

    return fromJwtPayload(payload);
  }
}
