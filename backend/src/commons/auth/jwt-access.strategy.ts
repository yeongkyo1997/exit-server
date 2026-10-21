import { UnauthorizedException, CACHE_MANAGER, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Cache } from "cache-manager";
import { Strategy, ExtractJwt } from "passport-jwt";
import {
  accessTokenBlacklistKey,
  bearerToken,
  fromJwtPayload,
} from "src/commons/auth/token.utils";

export class JwtAccessStrategy extends PassportStrategy(Strategy, "access") {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache //
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req, payload) {
    const accessToken = bearerToken(req.headers["authorization"]);
    const validation = await this.cacheManager.get(
      accessTokenBlacklistKey(accessToken)
    );

    if (validation) throw new UnauthorizedException();

    return fromJwtPayload(payload);
  }
}
