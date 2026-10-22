import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  UseGuards,
} from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { Cache } from "cache-manager";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import {
  consumeEmailVerification,
  isEmailVerified,
  verifyEmailCode,
} from "src/commons/auth/email-verification";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { revokeUserTokens } from "src/commons/auth/token.utils";
import { AuthUser } from "src/commons/type/context";
import { UsersService } from "src/users/users.service";
import { generateTempPassword } from "./email-code";
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
  // (sendEmailToken → checkEmailToken으로 방금 인증한 이메일만. 가입 여부는 응답으로 드러내지 않는다)
  @Mutation(() => String)
  async sendNewPassword(
    @Args("email", { type: () => String }) email: string //
  ) {
    // 인증 여부는 가입 여부와 무관하므로 조회보다 먼저 확인한다 (인증하지 않은 사람에게는 가입 여부가 보이지 않는다)
    if (!(await isEmailVerified(this.cacheManager, email)))
      throw new ForbiddenException("이메일 인증이 필요합니다.");

    const findUser = await this.usersService.findOneByEmailForAuth({ email });
    if (!findUser) {
      // 미가입 이메일에도 같은 응답을 준다 (인증은 1회용으로 소비)
      await consumeEmailVerification(this.cacheManager, email);
      return "이메일을 보냈습니다.";
    }

    // 여기부터는 입력값이 아니라 DB에 저장된 주소만 쓴다
    // (collation이 악센트·대소문자를 무시해 입력값이 다른 메일함일 수 있다)
    const targetEmail = findUser.email;
    if (!(await isEmailVerified(this.cacheManager, targetEmail)))
      throw new ForbiddenException("이메일 인증이 필요합니다.");

    // 12자리 임시 비밀번호 생성 (암호학적 난수)
    const password = generateTempPassword();

    await this.usersService.updatePassword({
      email: targetEmail,
      password,
    });

    // 재설정 전에 발급된 세션을 모두 끊는다
    await revokeUserTokens(this.cacheManager, findUser.id);

    // 메일이 실패하면 예외를 올려 인증 표시를 남긴다(다시 시도 가능). 성공한 뒤에만 소비한다
    await this.emailService.sendEmail({
      email: targetEmail,
      emailToken: password,
      newPassword: true,
    });
    await consumeEmailVerification(this.cacheManager, targetEmail);
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

  // 이메일 토큰 검증 (성공하면 가입·비밀번호 변경·재발급에 쓰는 '인증됨' 상태를 남긴다)
  @Mutation(() => String)
  async checkEmailToken(
    @Args("email", { type: () => String }) email: string,
    @Args("emailToken", { type: () => String }) emailToken: string
  ) {
    const result = await verifyEmailCode(this.cacheManager, email, emailToken);
    if (result === "locked")
      throw new Error(
        "인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아주세요."
      );
    if (result !== "ok") throw new Error("인증번호가 일치하지 않습니다.");
    return "인증되었습니다.";
  }

  // 토큰을 저장한 뒤 메일은 기다리지 않고 보낸다 (기존 동작 유지, 실패는 로그만 남긴다)
  private async issueAndSendEmailToken(email: string) {
    const emailToken = await this.emailService.issueToken(email);
    this.emailService
      .sendEmail({
        email,
        emailToken,
      })
      .catch((error) => console.error("이메일 전송 실패:", error?.message));
    return "이메일을 보냈습니다.";
  }
}
