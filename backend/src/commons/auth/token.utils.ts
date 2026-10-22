import { JwtService } from "@nestjs/jwt";
import { Cache } from "cache-manager";
import { Request } from "express";
import { ExtractJwt } from "passport-jwt";
import {
  accessTokenBlacklistKey,
  refreshTokenBlacklistKey,
  userTokensRevokedAtKey,
} from "src/commons/cache-keys";
import { REFRESH_TOKEN_TTL } from "src/commons/constants";
import { AuthUser } from "src/commons/type/context";

// 블랙리스트 키는 cache-keys.ts에 있다. 기존 import 경로를 위해 여기서도 내보낸다
export { accessTokenBlacklistKey, refreshTokenBlacklistKey };

// passport-jwt가 서명 검증에 쓰는 것과 같은 추출기.
// 블랙리스트 키가 검증된 토큰과 같은 문자열이어야 하므로 access 토큰은 반드시 이것(또는 bearerToken)으로 꺼낸다
// (split(" ")[1]은 "Bearer  <t>"·"Bearer\t<t>"에서 다른 값을 꺼내 블랙리스트를 우회당했다)
export const extractBearerToken: (req: Request) => string | null =
  ExtractJwt.fromAuthHeaderAsBearerToken();

// Authorization 헤더 문자열에서 토큰 부분 (없거나 형식이 다르면 null)
export const bearerToken = (authorization?: string): string | null =>
  extractBearerToken({ headers: { authorization } } as Request) || null;

// Cookie 헤더("a=1; refreshToken=<jwt>; b=2")에서 refreshToken 값만 꺼낸다 (없으면 null → passport가 401)
export const refreshCookieToken = (cookie?: string): string | null => {
  if (typeof cookie !== "string") return null;
  for (const part of cookie.split(";")) {
    const index = part.indexOf("=");
    if (index !== -1 && part.slice(0, index).trim() === "refreshToken") {
      return part.slice(index + 1).trim() || null;
    }
  }
  return null;
};

// socket.io 핸드셰이크에서 access 토큰을 꺼낸다: auth.token → Authorization 헤더 순.
// "Bearer <t>" 형식이면 HTTP와 같은 추출기로 꺼내고, 접두사 없는 토큰도 받는다.
// 쿼리스트링 토큰은 로그에 남으므로 받지 않는다. 없으면 null
export const socketAccessToken = (handshake: {
  auth?: { [key: string]: unknown };
  headers?: { authorization?: string };
}): string | null => {
  const authToken = handshake?.auth?.token;
  const raw =
    typeof authToken === "string" && authToken.trim()
      ? authToken
      : handshake?.headers?.authorization;
  if (typeof raw !== "string" || !raw.trim()) return null;

  const token = bearerToken(raw);
  if (token) return token;
  return /^\S+$/.test(raw.trim()) ? raw.trim() : null;
};

export const toJwtPayload = (user: AuthUser) => ({
  email: user.email,
  sub: user.id,
  nickname: user.nickname,
});

export const fromJwtPayload = (payload): AuthUser => ({
  email: payload.email,
  id: payload.sub,
  nickname: payload.nickname,
});

// 서명을 통과한 payload에 유저 id(sub)가 있는지
export const hasSubject = (payload): boolean =>
  typeof payload?.sub === "string" && payload.sub.length > 0;

// 유저 단위 토큰 무효화: 지금 시각(초) 이전에 발급된 그 유저의 access/refresh 토큰을 모두 거부하게 한다.
// (탈퇴·비밀번호 변경·재발급 뒤 호출. 같은 초에 발급된 토큰도 거부된다)
export const revokeUserTokens = async (cache: Cache, userId: string) => {
  await cache.set(
    userTokensRevokedAtKey(userId),
    Math.floor(Date.now() / 1000),
    {
      ttl: REFRESH_TOKEN_TTL,
    }
  );
};

// payload가 revokeUserTokens 이전에 발급된 토큰이면 true (iat가 없으면 무효화 이후에는 거부)
export const isRevokedForUser = async (
  cache: Cache,
  payload
): Promise<boolean> => {
  if (!hasSubject(payload)) return false;
  const revokedAt = await cache.get(userTokensRevokedAtKey(payload.sub));
  if (typeof revokedAt !== "number") return false;
  return !(typeof payload.iat === "number" && payload.iat > revokedAt);
};

// since(초)와 같은 초이거나 그 뒤에 그 유저의 토큰이 무효화되었으면 true
// (로그인이 옛 비밀번호 해시를 읽은 뒤 비밀번호 변경·재설정·탈퇴가 끼어들었는지 확인할 때 쓴다)
export const isUserRevokedSince = async (
  cache: Cache,
  userId: string,
  since: number
): Promise<boolean> => {
  const revokedAt = await cache.get(userTokensRevokedAtKey(userId));
  return typeof revokedAt === "number" && revokedAt >= since;
};

// 로그아웃(블랙리스트)한 access 토큰인지
export const isAccessTokenBlacklisted = async (cache: Cache, token: string) =>
  !!(await cache.get(accessTokenBlacklistKey(token)));

// 로그아웃(블랙리스트)한 refresh 토큰인지
export const isRefreshTokenBlacklisted = async (cache: Cache, token: string) =>
  !!(await cache.get(refreshTokenBlacklistKey(token)));

// 가드 밖(소켓 핸드셰이크, 가드 없는 쿼리의 필드 리졸버)에서 access 토큰을 JwtAccessStrategy와 같은 규칙으로 검증한다:
// JWT_ACCESS_SECRET 서명·만료 → sub 존재 → 로그아웃 블랙리스트 → 유저 단위 무효화.
// 하나라도 실패하면(redis 오류 포함) 예외 대신 null (= 비로그인)
export const verifyAccessToken = async (
  jwtService: JwtService,
  cache: Cache,
  token: string
): Promise<AuthUser | null> => {
  if (typeof token !== "string" || !token) return null;
  try {
    const payload = jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_SECRET,
    });
    if (!hasSubject(payload)) return null;
    if (await isAccessTokenBlacklisted(cache, token)) return null;
    if (await isRevokedForUser(cache, payload)) return null;
    return fromJwtPayload(payload);
  } catch {
    return null;
  }
};
