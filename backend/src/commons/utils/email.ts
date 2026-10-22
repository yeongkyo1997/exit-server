// 이메일 비교·캐시 키용 정규화: 앞뒤 공백 제거 + ASCII 대문자만 소문자로
// (toLowerCase는 U+212A(켈빈 기호) 같은 문자를 ASCII로 바꿔 다른 주소를 같게 만들 수 있다)
export const normalizeEmail = (email: string) =>
  String(email ?? "")
    .trim()
    .replace(/[A-Z]/g, (char) => char.toLowerCase());

// ASCII 문자만으로 된 이메일인지 (MySQL collation이 악센트·대소문자를 무시하므로
// gmäil.com 같은 변형 주소가 기존 주소와 같은 행으로 조회될 수 있다)
export const isAsciiEmail = (email: string) =>
  typeof email === "string" && /^[\x21-\x7e]+$/.test(email.trim());
