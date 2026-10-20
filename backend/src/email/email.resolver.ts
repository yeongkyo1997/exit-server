import { CACHE_MANAGER, Inject } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { Cache } from "cache-manager";
import { UsersService } from "src/users/users.service";
import { EmailService } from "./email.service";
import { emailVerifiedKey } from "./email-verified";
@Resolver()
export class EmailResolver {
  constructor(
    private readonly emailService: EmailService, //
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  // emailToken을 redis에 3분동안 저장하고 이메일로 보내기
  @Mutation(() => String)
  async sendSignupEmailToken(
    @Args("email", { type: () => String }) email: string
  ) {
    // 유저 생성 전에 이메일 중복 체크

    const findUser = await this.usersService.checkEmailDuplicate({ email });
    if (findUser) throw new Error("이미 등록된 이메일입니다.");
    // 6자리 이메일 토큰 생성
    const emailToken = Math.random().toString(36).substring(2, 8);

    // ttl: 3분
    await this.cacheManager.set(email, emailToken, { ttl: 180 });
    this.cacheManager.get(email).then((res) => console.log(res));
    this.emailService.sendEmail({
      email,
      emailToken,
    });
    return "이메일을 보냈습니다.";
  }

  @Mutation(() => String)
  async sendEmailToken(
    @Args("email", { type: () => String }) email: string //
  ) {
    // 6자리 이메일 토큰 생성
    const emailToken = Math.random().toString(36).substring(2, 8);

    // ttl: 3분
    await this.cacheManager.set(email, emailToken, { ttl: 180 });
    this.cacheManager.get(email).then((res) => console.log(res));
    this.emailService.sendEmail({
      email,
      emailToken,
    });
    return "이메일을 보냈습니다.";
  }

  // 랜덤한 비밀번호 생성하고 이메일로 보내기
  @Mutation(() => String)
  async sendNewPassword(
    @Args("email", { type: () => String }) email: string, //
    @Args("emailToken", { type: () => String, nullable: true })
    emailToken?: string
  ) {
    // 인증번호를 함께 보내거나 checkEmailToken으로 먼저 인증한 경우에만 재발급한다
    const cacheEmailToken = await this.cacheManager.get(email);
    const isVerified =
      (emailToken && cacheEmailToken === emailToken) ||
      (await this.cacheManager.get(emailVerifiedKey(email)));
    if (!isVerified) throw new Error("이메일 인증이 필요합니다.");

    const findUser = await this.usersService.findOneByEmail({ email });
    if (!findUser) throw new Error("등록되지 않은 이메일입니다.");

    await this.cacheManager.del(email);
    await this.cacheManager.del(emailVerifiedKey(email));

    // 6자리 이메일 토큰 생성
    const password = Math.random().toString(36).substring(2, 8);

    await this.usersService.updatePassword({
      email,
      password,
    });

    this.emailService.sendEmail({
      email,
      emailToken: password,
      newPassword: true,
    });
    return "이메일을 보냈습니다.";
  }

  // 이메일 토큰 검증
  @Mutation(() => String)
  async checkEmailToken(
    @Args("email", { type: () => String }) email: string,
    @Args("emailToken", { type: () => String }) emailToken: string
  ) {
    const cacheEmailToken = await this.cacheManager.get(email);
    if (!cacheEmailToken || cacheEmailToken !== emailToken)
      throw new Error("인증번호가 일치하지 않습니다.");

    // 인증 완료 표시를 10분간 남겨서 회원가입/비밀번호 변경 시 확인한다
    await this.cacheManager.set(emailVerifiedKey(email), true, { ttl: 600 });
    return "인증되었습니다.";
  }
}
