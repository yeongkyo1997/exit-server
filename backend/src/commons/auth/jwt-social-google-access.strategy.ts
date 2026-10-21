import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";

export class JwtGoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["email", "profile"],
    });
  }

  validate(accessToken, refreshToken, profile) {
    // 구글이 인증하지 않은 이메일로는 기존 계정에 연결하지 않는다
    const email = profile.emails?.[0];
    return {
      email: email?.verified === false ? undefined : email?.value,
      nickname: profile.displayName,
    };
  }
}
