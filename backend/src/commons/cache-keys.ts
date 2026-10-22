import { createHash } from "crypto";
import { normalizeEmail } from "src/commons/utils/email";

// CACHE_MANAGER(redis)는 모든 기능이 키 공간 하나를 같이 쓴다.
// - 키는 반드시 이 파일의 함수로 만든다. 사용자 입력을 그대로 키로 쓰지 않는다 (기능별 접두사)
// - 한 접두사(콜론까지)가 다른 접두사로 시작하면 안 된다 (예: emailCode:attempts: 금지, emailCodeAttempts:는 가능)
// - 로그아웃 블랙리스트 키(accessToken:/refreshToken:)는 이미 저장된 키(최대 2주)와 호환돼야 하므로 형식을 바꾸지 않는다
// - 키에 들어갈 값이 비어 있으면 예외를 던진다 (undefined가 "undefined" 키로 합쳐지지 않게)

const keyPart = (value: string) => {
  if (typeof value !== "string" || !value)
    throw new Error("캐시 키에 빈 값을 쓸 수 없습니다.");
  return value;
};

// 로그아웃한 토큰 (JWT 전략이 이 키로 차단 여부를 확인한다)
export const accessTokenBlacklistKey = (token: string) =>
  `accessToken:${keyPart(token)}`;
export const refreshTokenBlacklistKey = (token: string) =>
  `refreshToken:${keyPart(token)}`;

// 유저 단위 토큰 무효화 시각(초). 이 시각 이전에 발급된 access/refresh 토큰은 거부된다
export const userTokensRevokedAtKey = (userId: string) =>
  `tokensRevokedAt:${keyPart(userId)}`;

// 이메일 인증번호와 시도 횟수, 재발송 쿨다운, '인증됨' 표시 (이메일은 정규화해서 넣는다)
export const emailCodeKey = (email: string) =>
  `emailCode:${keyPart(normalizeEmail(email))}`;
export const emailCodeAttemptsKey = (email: string) =>
  `emailCodeAttempts:${keyPart(normalizeEmail(email))}`;
export const emailCodeCooldownKey = (email: string) =>
  `emailCodeCooldown:${keyPart(normalizeEmail(email))}`;
export const emailVerifiedKey = (email: string) =>
  `emailVerified:${keyPart(normalizeEmail(email))}`;

// 팀장이 출석을 활성화한 위치("위도,경도"). 팀장 user id 단위
export const leaderLocationKey = (leaderUserId: string) =>
  `attendance:leaderLocation:${keyPart(leaderUserId)}`;

// 게시글 검색 결과 캐시 (검색어 원문 대신 해시를 쓴다)
export const boardSearchCacheKey = (search: string) =>
  `boardSearch:${createHash("sha256").update(keyPart(search)).digest("hex")}`;
