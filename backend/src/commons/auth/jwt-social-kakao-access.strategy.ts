import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-kakao";

export class JwtKakaoStrategy extends PassportStrategy(Strategy, "kakao") {
  constructor() {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
      scope: ["account_email", "profile_nickname"],
    });
  }

  validate(accessToken, refreshToken, profile) {
    // 카카오가 유효·인증 확인하지 않은 이메일로는 기존 계정에 연결하지 않는다
    const account = profile._json.kakao_account;
    const isVerified =
      account?.is_email_valid !== false && account?.is_email_verified !== false;
    return {
      email: isVerified ? account?.email : undefined,
      nickname: profile._json.properties.nickname,
    };
  }
}
