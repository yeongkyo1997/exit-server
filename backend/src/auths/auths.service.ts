import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Cache } from "cache-manager";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import {
  ACCESS_TOKEN_TTL,
  ALLOWED_ORIGINS,
  REFRESH_TOKEN_TTL,
} from "src/commons/constants";
import {
  accessTokenBlacklistKey,
  bearerToken,
  refreshTokenBlacklistKey,
  toJwtPayload,
} from "src/commons/auth/token.utils";
import { hashPassword } from "src/commons/utils/password";

@Injectable()
export class AuthsService {
  constructor(
    private readonly usersService: UsersService, //
    private readonly jwtService: JwtService, //
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async login({ email, password, req, res }) {
    // 1. email로 유저 찾기
    const user = await this.usersService.findOneByEmailForAuth({ email });

    // 2. 일치하는 유저가 없으면 에러
    if (!user) {
      throw new UnprocessableEntityException("존재하지 않는 이메일입니다.");
    }

    // 예전 소셜 가입자는 이메일이 비밀번호로 저장되어 있으므로 이메일과 같은 비밀번호는 거부
    // (입력값은 대소문자만 바꿔도 같은 유저가 조회되므로 저장된 이메일과 비교한다)
    if (password === user.email) {
      throw new UnprocessableEntityException(
        "이메일과 같은 비밀번호로는 로그인할 수 없습니다. 비밀번호를 재발급 받아주세요."
      );
    }

    // 3. 일치하는 유저가 있지만, 비밀번호가 일치하지 않으면!? 에러 발생
    const isAuth = await bcrypt.compare(password, user.password);
    if (!isAuth) {
      throw new UnprocessableEntityException("비밀번호가 일치하지 않습니다.");
    }

    // 4. 일치하는 유저가 있고, 비밀번호가 일치하면?!
    // (기존 동작 유지: await하지 않으므로 리프레시 토큰 발급이 실패해도 로그인은 성공한다)
    this.setRefreshToken({ user, res, req });

    // 5. 토큰 발급
    return this.getAccessToken({ user });
  }

  // 가드 없이 두 토큰을 직접 검증한 뒤 블랙리스트에 등록한다
  async logout({ req }) {
    const accessToken = bearerToken(req.headers["authorization"]);
    // refreshCookieToken()(replace)과 파싱 결과가 달라 기존 split("=")[1]을 그대로 쓴다 (기존 동작 유지)
    const refreshToken = req.headers["cookie"].split("=")[1];

    // 인증이 되었는지 확인하는 로직
    try {
      this.jwtService.verify(accessToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException();
    }

    // 토큰의 유효시간에 맞게 ttl을 설정해서 캐시에 등록한다
    await this.cacheManager.set(
      accessTokenBlacklistKey(accessToken),
      "accessToken",
      { ttl: ACCESS_TOKEN_TTL }
    );
    await this.cacheManager.set(
      refreshTokenBlacklistKey(refreshToken),
      "refreshToken",
      { ttl: REFRESH_TOKEN_TTL }
    );
    return "로그아웃에 성공했습니다.";
  }

  async setRefreshToken({ user, res, req }) {
    const refreshToken = this.jwtService.sign(toJwtPayload(user), {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: REFRESH_TOKEN_TTL,
    });

    // 배포환경 (팀프로젝트)
    res.setHeader("Access-Control-Allow-Origin", "https://ex1t.shop");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    const origin = req.headers.origin;

    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Origin, Accept,Access-Control-Requested-Method, Access-Control-Request-Headers"
    );
    res.setHeader(
      "Set-Cookie",
      `refreshToken=${refreshToken}; path=/; domain=.mainproject04.shop; httpOnly; SameSite=None; Secure`
    );
  }

  getAccessToken({ user }) {
    return this.jwtService.sign(toJwtPayload(user), {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  async socialLogin({ req, res }) {
    // 이메일이 없으면 어떤 계정으로 로그인시킬지 알 수 없다
    if (!req.user.email)
      throw new UnauthorizedException("이메일 제공 동의가 필요합니다.");

    let user = await this.usersService.findOneByEmailForAuth({
      email: req.user.email,
    });

    if (!user) {
      // 소셜 가입자는 비밀번호 로그인을 쓰지 않으므로 추측할 수 없는 임의 값을 저장한다
      const password = await hashPassword(randomBytes(32).toString("hex"));

      const createUserInput = req.user;

      createUserInput["userImage"] = {
        url: "null",
      };

      user = await this.usersService.create({
        createUserInput,
        password,
      });
    }

    await this.setRefreshToken({ user, res, req });

    res.redirect("http://localhost:3000");
  }
}
