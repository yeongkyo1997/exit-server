import { Cache } from "cache-manager";
import {
  emailCodeAttemptsKey,
  emailCodeCooldownKey,
  emailCodeKey,
  emailVerifiedKey,
} from "src/commons/cache-keys";
import {
  EMAIL_CODE_MAX_ATTEMPTS,
  EMAIL_CODE_RESEND_COOLDOWN,
  EMAIL_CODE_TTL,
  EMAIL_VERIFIED_TTL,
} from "src/commons/constants";
import { incrementWithTtl, setIfAbsent } from "src/commons/utils/cache";
import { normalizeEmail } from "src/commons/utils/email";
import { generateEmailCode } from "src/email/email-code";

export { isAsciiEmail, normalizeEmail } from "src/commons/utils/email";

// 이메일 인증 흐름: issueEmailCode(발급) → verifyEmailCode(checkEmailToken) → isEmailVerified(가입·비밀번호 변경·재발급 직전)
// → consumeEmailVerification(그 작업이 성공한 뒤). 서비스로 만들지 않는다
// (EmailModule이 UsersModule을 import하므로 UsersResolver가 EmailService를 쓰면 모듈이 순환한다)

// 입력 인증번호 비교용 정규화 (생성기가 [0-9a-z]만 쓰므로 ASCII 대문자만 소문자로)
const normalizeCode = (code: string) =>
  String(code ?? "")
    .trim()
    .replace(/[A-Z]/g, (char) => char.toLowerCase());

export type IssueEmailCodeResult =
  | { status: "issued"; code: string; reused: boolean }
  | { status: "cooldown" }
  | { status: "invalid" };

// 인증번호를 발급(또는 대기 중인 번호를 재사용)하고 메일로 보낼 번호를 돌려준다.
// - 빈 이메일이면 invalid
// - 같은 이메일로 EMAIL_CODE_RESEND_COOLDOWN초 안에 다시 부르면 cooldown (메일 폭탄·무차별 대입 완화)
// - 아직 유효한 번호가 있으면 같은 번호를 다시 쓰고 시도 횟수도 이어서 센다
//   (다른 사람이 같은 이메일로 재요청해도 이미 받은 번호가 무효가 되지 않게)
export const issueEmailCode = async (
  cache: Cache,
  email: string
): Promise<IssueEmailCodeResult> => {
  if (!normalizeEmail(email)) return { status: "invalid" };

  const issuable = await setIfAbsent(
    cache,
    emailCodeCooldownKey(email),
    EMAIL_CODE_RESEND_COOLDOWN
  );
  if (!issuable) return { status: "cooldown" };

  const pending = await cache.get(emailCodeKey(email));
  const reused = typeof pending === "string" && pending.length > 0;
  const code = reused ? (pending as string) : generateEmailCode();

  // 새 번호면 시도 횟수를 처음부터 센다
  if (!reused) await cache.del(emailCodeAttemptsKey(email));
  await cache.set(emailCodeKey(email), code, { ttl: EMAIL_CODE_TTL });
  return { status: "issued", code, reused };
};

export type EmailCodeResult = "ok" | "mismatch" | "locked";

// checkEmailToken용. 맞으면 '인증됨' 표시를 EMAIL_VERIFIED_TTL초 동안 남긴다.
// 번호 1개당 EMAIL_CODE_MAX_ATTEMPTS번까지 확인할 수 있고(원자적 INCR), 넘으면 번호를 폐기하고 locked.
// 성공해도 번호는 TTL 동안 남긴다(프론트가 같은 번호로 다시 확인해도 깨지지 않게, 이것도 시도로 센다)
export const verifyEmailCode = async (
  cache: Cache,
  email: string,
  code: string
): Promise<EmailCodeResult> => {
  if (!normalizeEmail(email)) return "mismatch";

  const savedCode = await cache.get(emailCodeKey(email));
  if (typeof savedCode !== "string" || !savedCode) {
    // 한도를 넘겨 폐기된 직후라면 다시 받으라고 알려 준다
    const attempts = Number(await cache.get(emailCodeAttemptsKey(email)));
    return attempts > EMAIL_CODE_MAX_ATTEMPTS ? "locked" : "mismatch";
  }

  let attempts: number;
  try {
    attempts = await incrementWithTtl(
      cache,
      emailCodeAttemptsKey(email),
      EMAIL_CODE_TTL
    );
  } catch {
    // 카운터를 올리지 못하면 잠근 것으로 본다
    attempts = Infinity;
  }
  if (attempts > EMAIL_CODE_MAX_ATTEMPTS) {
    await cache.del(emailCodeKey(email));
    return "locked";
  }
  if (savedCode !== normalizeCode(code)) return "mismatch";

  await cache.set(emailVerifiedKey(email), true, { ttl: EMAIL_VERIFIED_TTL });
  return "ok";
};

// checkEmailToken을 최근(EMAIL_VERIFIED_TTL초 안에) 통과한 이메일인지.
// 반드시 === true로 비교한다 (다른 기능이 truthy 값을 쓰더라도 위조되지 않게)
export const isEmailVerified = async (cache: Cache, email: string) =>
  !!normalizeEmail(email) &&
  (await cache.get(emailVerifiedKey(email))) === true;

// 가입·비밀번호 변경·재발급이 성공한 뒤 호출해 인증을 1회용으로 만든다 (재발송 쿨다운은 남긴다)
export const consumeEmailVerification = async (cache: Cache, email: string) => {
  if (!normalizeEmail(email)) return;
  await cache.del(emailVerifiedKey(email));
  await cache.del(emailCodeKey(email));
  await cache.del(emailCodeAttemptsKey(email));
};
