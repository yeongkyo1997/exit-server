import { UnauthorizedException, CACHE_MANAGER, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Cache } from "cache-manager";
import { Request } from "express";
import { Strategy } from "passport-jwt";
import {
  extractBearerToken,
  fromJwtPayload,
  hasSubject,
  isAccessTokenBlacklisted,
  isRevokedForUser,
} from "src/commons/auth/token.utils";

export class JwtAccessStrategy extends PassportStrategy(Strategy, "access") {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache //
  ) {
    super({
      jwtFromRequest: extractBearerToken,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload) {
    // 서명을 검증한 것과 같은 추출기로 꺼내야 블랙리스트 키가 같은 토큰을 가리킨다
    const accessToken = extractBearerToken(req);
    if (!accessToken || !hasSubject(payload)) throw new UnauthorizedException();

    // 로그아웃한 토큰
    if (await isAccessTokenBlacklisted(this.cacheManager, accessToken))
      throw new UnauthorizedException();

    // 탈퇴·비밀번호 변경·재발급 전에 발급된 토큰
    if (await isRevokedForUser(this.cacheManager, payload))
      throw new UnauthorizedException();

    return fromJwtPayload(payload);
  }
}
