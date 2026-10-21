export const ALLOWED_ORIGINS: string[] = [
  "http://localhost:3000",
  "https://ex1t.shop",
];

export const PASSWORD_SALT_ROUNDS = 10;

// JWT expiresIn과 로그아웃 블랙리스트 TTL이 같은 값을 쓴다 (초)
export const ACCESS_TOKEN_TTL = 60 * 60; // 1시간
export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7 * 2; // 2주
