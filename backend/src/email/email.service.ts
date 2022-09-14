import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
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

    const message = {
      from: process.env.EMAIL_AUTH_EMAIL,
      to: email,
      subject: newPassword
        ? "새로운 비밀번호 발급"
        : changePassword
        ? "비밀번호 변경 인증번호"
        : "이메일 인증",
      html: newPassword
        ? htmlForPassword
        : changePassword
        ? htmlForChangePassword
        : htmlForEmail,
    };
    await transporter.sendMail(message).then((info) => {
      console.log("Email sent: " + info.response);
    });
  }
}
