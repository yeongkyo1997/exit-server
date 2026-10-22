import { randomInt } from "crypto";

const CODE_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

// 암호학적 난수(crypto.randomInt)로 CODE_ALPHABET에서 length자를 뽑는다
const randomCode = (length: number) =>
  Array.from(
    { length },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  ).join("");

// 6자리 이메일 인증번호 (기존과 같은 [0-9a-z], 항상 6자)
export const generateEmailCode = () => randomCode(6);

// 비밀번호 찾기 임시 비밀번호 (12자 [0-9a-z], 약 62비트)
export const generateTempPassword = () => randomCode(12);
