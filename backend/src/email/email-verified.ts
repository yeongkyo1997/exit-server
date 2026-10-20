// checkEmailToken으로 인증을 마친 이메일을 표시하는 캐시 키
export const emailVerifiedKey = (email: string) => `emailVerified:${email}`;
