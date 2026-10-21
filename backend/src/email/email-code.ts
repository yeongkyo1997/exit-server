// 6자리 이메일 토큰(임시 비밀번호) 생성
export const generateEmailCode = () =>
  Math.random().toString(36).substring(2, 8);
