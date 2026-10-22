import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import * as nodemailer from "nodemailer";
import { issueEmailCode } from "src/commons/auth/email-verification";

@Injectable()
export class EmailService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache //
  ) {}

  // 3분동안 유효한 이메일 토큰을 접두사 키(emailCode:<email>)에 저장하고 반환
  // (대기 중인 번호가 있으면 같은 번호를 다시 쓰고, 같은 이메일로 60초 안에 다시 요청하면 거절한다)
  async issueToken(email: string) {
    const result = await issueEmailCode(this.cacheManager, email);
    if (result.status === "invalid") throw new Error("이메일을 입력해주세요.");
    if (result.status === "cooldown")
      throw new Error("잠시 후 다시 시도해주세요.");
    return result.code;
  }

  async sendEmail({
    email,
    emailToken,
    newPassword = false,
    changePassword = false,
  }) {
    const {
      EMAIL_AUTH_EMAIL,
      EMAIL_HOST,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN,
    } = process.env;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: EMAIL_HOST,
      port: 587,
      secure: true,
      auth: {
        type: "OAuth2",
        user: EMAIL_AUTH_EMAIL,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
      },
    });

    // 새로운 비밀번호를 발급
    const htmlForPassword = `
    <div style="width: 100%; height: 100%; background-color: #f5f5f5; padding: 50px 0;">
      <div style="width: 500px; height: 500px; background-color: #fff; margin: 0 auto; padding: 50px;">
        <h1 style="font-size: 30px; font-weight: 700; margin-bottom: 30px;">비밀번호 찾기</h1>
        <p style="font-size: 20px; font-weight: 400; margin-bottom: 30px;">새로운 비밀번호는 <span style="font-weight: 700;">${emailToken}</span> 입니다.</p>
        `;

    // 이메일 인증
    const htmlForEmail = `
    <div style="width: 100%; height: 100%; background-color: #f5f5f5; padding: 50px 0;">
      <div style="width: 500px; height: 500px; background-color: #fff; margin: 0 auto; padding: 50px;">
        <h1 style="font-size: 30px; font-weight: 700; margin-bottom: 30px;">이메일 인증</h1>
        <p style="font-size: 20px; font-weight: 400; margin-bottom: 30px;">인증번호는 <span style="font-weight: 700;">${emailToken}</span> 입니다.</p>
        `;

    // 비밀번호 변경 토큰 발급
    const htmlForChangePassword = `
      <div style="width: 100%; height: 100%; background-color: #f5f5f5; padding: 50px 0;">
        <div style="width: 500px; height: 500px; background-color: #fff; margin: 0 auto; padding: 50px;">
          <h1 style="font-size: 30px; font-weight: 700; margin-bottom: 30px;">비밀번호 변경</h1>
          <p style="font-size: 20px; font-weight: 400; margin-bottom: 30px;">인증번호는 <span style="font-weight: 700;">${emailToken}</span> 입니다.</p>
          `;

    // 새 비밀번호 > 비밀번호 변경 > 이메일 인증 순으로 고른다
    const [subject, html] = newPassword
      ? ["새로운 비밀번호 발급", htmlForPassword]
      : changePassword
      ? ["비밀번호 변경 인증번호", htmlForChangePassword]
      : ["이메일 인증", htmlForEmail];

    const message = {
      from: process.env.EMAIL_AUTH_EMAIL,
      to: email,
      subject,
      html,
    };
    await transporter.sendMail(message).then((info) => {
      console.log("Email sent: " + info.response);
    });
  }
}
