import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import dotenv from "dotenv";

@Injectable()
export class EmailService {
  async sendEmailToken({ email, emailToken }) {
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
    const message = {
      from: process.env.EMAIL_AUTH_EMAIL,
      to: email,
      subject: "EXIT 회원가입 인증 메일입니다.",
      html: `
      <h1>
        EXIT 회원가입 인증 메일입니다. 아래 인증번호를 입력해주세요.
      </h1>
      <hr />
      <br />
      <p>인증번호: ${emailToken}</p>
    `,
    };
    await transporter.sendMail(message).then((info) => {
      console.log("Email sent: " + info.response);
    });
  }
}
