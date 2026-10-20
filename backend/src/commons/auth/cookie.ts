// Cookie 헤더에서 refreshToken 값만 꺼낸다. 쿠키가 여러 개여도 동작한다.
export function getRefreshToken(cookie?: string): string | null {
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === "refreshToken") return value.join("=");
  }
  return null;
}
