import { AuthUser } from "src/commons/type/context";

// "Bearer <token>" 형식의 Authorization 헤더에서 토큰 부분
export const bearerToken = (authorization: string) =>
  authorization.split(" ")[1];

// "refreshToken=<token>" 형식의 Cookie 헤더에서 토큰 부분
export const refreshCookieToken = (cookie: string) =>
  cookie.replace("refreshToken=", "");

// 로그아웃한 토큰을 저장하는 캐시 키 (JWT 전략이 이 키로 차단 여부를 확인한다)
export const accessTokenBlacklistKey = (token: string) =>
  `accessToken:${token}`;
export const refreshTokenBlacklistKey = (token: string) =>
  `refreshToken:${token}`;

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
