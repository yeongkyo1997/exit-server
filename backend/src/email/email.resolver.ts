import { CACHE_MANAGER, Inject, UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { Cache } from "cache-manager";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { AuthUser } from "src/commons/type/context";
import { UsersService } from "src/users/users.service";
import { generateEmailCode } from "./email-code";
import { EmailService } from "./email.service";

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
    // 유저 생성 전에 이메일 중복 체크 (중복이면 ConflictException)
    await this.usersService.checkEmailDuplicate({ email });
    return this.issueAndSendEmailToken(email);
  }

  @Mutation(() => String)
  async sendEmailToken(
    @Args("email", { type: () => String }) email: string //
  ) {
    return this.issueAndSendEmailToken(email);
  }

  // 랜덤한 비밀번호 생성하고 이메일로 보내기
  @Mutation(() => String)
  async sendNewPassword(
    @Args("email", { type: () => String }) email: string //
  ) {
    // 가입된 이메일인지 확인
    const findUser = await this.usersService.findOneByEmail({ email });
    if (!findUser) throw new Error("등록되지 않은 이메일입니다.");

    // 6자리 임시 비밀번호 생성
    const password = generateEmailCode();

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

  // 비밀번호 변경을 위한 이메일 토큰 생성
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  async sendPasswordEmailToken(
    @CurrentUser() user: AuthUser //
  ) {
    const emailToken = await this.emailService.issueToken(user.email);

    // 이메일 토큰 전송하기
    await this.emailService.sendEmail({
      email: user.email,
      emailToken,
      changePassword: true,
    });
    return true;
  }

  // 이메일 토큰 검증
  @Mutation(() => String)
  async checkEmailToken(
    @Args("email", { type: () => String }) email: string,
    @Args("emailToken", { type: () => String }) emailToken: string
  ) {
    const cacheEmailToken = await this.cacheManager.get(email);
    if (cacheEmailToken !== emailToken)
      throw new Error("인증번호가 일치하지 않습니다.");
    return "인증되었습니다.";
  }

  // 토큰을 저장한 뒤 메일은 기다리지 않고 보낸다 (기존 동작 유지)
  private async issueAndSendEmailToken(email: string) {
    const emailToken = await this.emailService.issueToken(email);
    this.emailService.sendEmail({
      email,
      emailToken,
    });
    return "이메일을 보냈습니다.";
  }
}
