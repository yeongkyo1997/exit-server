import { UnauthorizedException, CACHE_MANAGER, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Cache } from 'cache-manager';
import { Strategy, ExtractJwt } from 'passport-jwt';

export class JwtAccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache, //
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'myAccessKey',
      passReqToCallback: true,
    });
  }

  async validate(req, payload) {
    const accessToken = req.headers['authorization'].split(' ')[1];
    const validation = await this.cacheManager.get(
      `accessToken:${accessToken}`,
    );

    if (validation) throw new UnauthorizedException();

    return {
      email: payload.email,
      id: payload.sub,
    };
  }
}
