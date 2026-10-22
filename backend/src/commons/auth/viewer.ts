import { JwtService } from "@nestjs/jwt";
import { Cache } from "cache-manager";
import { bearerToken, verifyAccessToken } from "src/commons/auth/token.utils";
import { AuthUser, IContext } from "src/commons/type/context";

// 가드가 없는 요청에서도 Authorization 헤더의 access 토큰으로 요청자를 알아낸다 (필드 단위 공개 범위용).
// 가드를 통과한 요청이면 req.user를 그대로 쓴다. 토큰이 없거나 무효·로그아웃·무효화된 토큰이면 null(= 비로그인).
// GraphQL context(요청)당 한 번만 계산해 context.viewer에 둔다
export const resolveViewer = (
  context: IContext,
  jwtService: JwtService,
  cacheManager: Cache
): Promise<AuthUser | null> =>
  (context.viewer ??= (async (): Promise<AuthUser | null> => {
    const guardedUser = context.req?.user;
    if (guardedUser?.id) return guardedUser;

    const token = bearerToken(context.req?.headers?.authorization);
    if (!token) return null;
    return verifyAccessToken(jwtService, cacheManager, token);
  })());

// 이 요청의 요청자를 직접 정한다 (createUser 응답처럼 방금 만든 계정을 본인으로 보여 줄 때)
export const setViewer = (context: IContext, user: AuthUser) => {
  context.viewer = Promise.resolve(user);
};

// 요청자가 그 유저 본인인지
export const isOwner = (viewer: AuthUser | null, user: { id?: string }) =>
  !!viewer?.id && viewer.id === user?.id;

// 본인이 아닌 사람에게 보여 줄 이메일: 첫 글자와 도메인만 남긴다 (a***@example.com)
export const maskEmail = (email: string) => {
  if (typeof email !== "string") return "***";
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  return `${String.fromCodePoint(email.codePointAt(0))}***${email.slice(at)}`;
};
