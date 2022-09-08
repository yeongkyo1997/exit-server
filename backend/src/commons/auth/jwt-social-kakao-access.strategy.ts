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
    return {
      email: profile._json.kakao_account.email,
      password: profile._json.kakao_account.email,
      nickname: profile._json.properties.nickname,
    };
  }
}
