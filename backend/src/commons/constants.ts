export const ALLOWED_ORIGINS: string[] = [
  "http://localhost:3000",
  "https://ex1t.shop",
];

export const PASSWORD_SALT_ROUNDS = 10;

// JWT expiresIn과 로그아웃 블랙리스트 TTL이 같은 값을 쓴다 (초)
export const ACCESS_TOKEN_TTL = 60 * 60; // 1시간
export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7 * 2; // 2주

// 이메일 인증 (초)
export const EMAIL_CODE_TTL = 60 * 3; // 인증번호 유효시간, 기존 180초 유지
export const EMAIL_CODE_MAX_ATTEMPTS = 5; // 인증번호 1개당 checkEmailToken 시도 한도
export const EMAIL_CODE_RESEND_COOLDOWN = 60; // 같은 이메일로 다시 발급받을 수 있는 간격
export const EMAIL_VERIFIED_TTL = 60 * 10; // checkEmailToken 통과 후 가입·비밀번호 변경·재발급을 마칠 시간

// 업로드 제한 (바이트). graphqlUploadExpress 전역 제한은 가드보다 먼저 적용된다
export const UPLOAD_MAX_FILE_SIZE = 50 * 1024 * 1024; // 파일 하나 (zip 기준)
export const UPLOAD_MAX_FILES = 5; // 요청 하나에 실을 수 있는 파일 수
export const UPLOAD_MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 이미지(board/user) 하나
