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
  NO_IMAGE_URL,
  REFRESH_TOKEN_TTL,
} from "src/commons/constants";
import {
  accessTokenBlacklistKey,
  bearerToken,
  isUserRevokedSince,
  refreshCookieToken,
  refreshTokenBlacklistKey,
  toJwtPayload,
} from "src/commons/auth/token.utils";
import { normalizeEmail } from "src/commons/utils/email";
import { hashPassword } from "src/commons/utils/password";

// 가입 여부가 드러나지 않도록 로그인 실패 메시지는 하나로 통일한다
const INVALID_LOGIN_MESSAGE = "이메일 또는 비밀번호가 일치하지 않습니다.";

@Injectable()
export class AuthsService {
  // 미가입 이메일에도 같은 bcrypt 비교 시간을 쓰기 위한 더미 해시
  private readonly dummyHash = hashPassword(randomBytes(16).toString("hex"));

  constructor(
    private readonly usersService: UsersService, //
    private readonly jwtService: JwtService, //
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async login({ email, password, req, res }) {
    // 레거시 소셜 가입자 안내는 계정 존재 여부와 무관하게 입력값만으로 판단한다
    if (password === email) {
      throw new UnprocessableEntityException(
        "이메일과 같은 비밀번호로는 로그인할 수 없습니다. 비밀번호를 재발급 받아주세요."
      );
    }

    // 조회 전에 시각을 잡아 둔다: 옛 해시를 읽은 뒤 비밀번호 변경·재설정·탈퇴로 무효화되면 아래에서 거부한다
    const loginStartedAt = Math.floor(Date.now() / 1000);

    // 1. email로 유저 찾기
    const user = await this.usersService.findOneByEmailForAuth({ email });

    // 2. 가입 여부와 무관하게 bcrypt 비교를 정확히 한 번 수행해 응답 시간을 맞춘다
    const isAuth = await bcrypt.compare(
      password,
      user ? user.password : await this.dummyHash
    );

    // 3. 미가입·비밀번호 불일치·저장 이메일과 같은 비밀번호(예전 소셜 가입자는 이메일이 비밀번호로 저장됨,
    //    입력과 대소문자 등만 다른 경우)는 모두 같은 메시지로 거부한다
    if (!user || !isAuth || password === user.email) {
      throw new UnprocessableEntityException(INVALID_LOGIN_MESSAGE);
    }

    // 로그인이 시작된 뒤(같은 초 포함) 무효화되었으면 옛 비밀번호로 확인한 로그인이므로 토큰을 발급하지 않는다.
    // 이 검사와 서명(setRefreshToken 첫 줄에서 동기로 서명) 사이에는 await를 두지 않는다
    if (await isUserRevokedSince(this.cacheManager, user.id, loginStartedAt))
      throw new UnprocessableEntityException(INVALID_LOGIN_MESSAGE);

    // 4. 일치하는 유저가 있고, 비밀번호가 일치하면?!
    // (기존 동작 유지: await하지 않으므로 리프레시 토큰 발급이 실패해도 로그인은 성공한다)
    this.setRefreshToken({ user, res, req });

    // 5. 토큰 발급
    return this.getAccessToken({ user });
  }

  // 가드 없이 두 토큰을 직접 검증한 뒤 블랙리스트에 등록한다
  async logout({ req }) {
    // 가드·전략과 같은 추출기를 써야 블랙리스트 키가 검증된 토큰과 같은 문자열이 된다
    const accessToken = bearerToken(req.headers["authorization"]);
    const refreshToken = refreshCookieToken(req.headers["cookie"]);
    if (!accessToken || !refreshToken) throw new UnauthorizedException();

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
    // COOKIE_DOMAIN이 없으면 domain 속성을 빼서 응답한 호스트에만 쿠키를 둔다
    const cookieDomain = process.env.COOKIE_DOMAIN
      ? `; domain=${process.env.COOKIE_DOMAIN}`
      : "";
    res.setHeader(
      "Set-Cookie",
      `refreshToken=${refreshToken}; path=/${cookieDomain}; httpOnly; SameSite=None; Secure`
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

    // DB collation은 악센트·대소문자를 무시하므로 victim@gmäil.com 같은 변형 주소도 기존 계정으로 조회된다.
    // 공백·ASCII 대소문자 차이만 같은 주소로 인정하고, 그 밖에 다르면 그 계정으로 로그인시키지 않는다
    if (user && normalizeEmail(user.email) !== normalizeEmail(req.user.email))
      throw new UnauthorizedException(
        "가입된 계정의 이메일과 일치하지 않습니다."
      );

    if (!user) {
      // 소셜 가입자는 비밀번호 로그인을 쓰지 않으므로 추측할 수 없는 임의 값을 저장한다
      const password = await hashPassword(randomBytes(32).toString("hex"));

      const createUserInput = req.user;

      createUserInput["userImage"] = {
        url: NO_IMAGE_URL,
      };

      user = await this.usersService.create({
        createUserInput,
        password,
      });
    }

    await this.setRefreshToken({ user, res, req });

    res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
  }
}
