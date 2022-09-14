import { CACHE_MANAGER, Inject } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { Cache } from "cache-manager";
import { UsersService } from "src/users/users.service";
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

  // 랜덤한 비밀번호 생성하고 이메일로 보내기
  @Mutation(() => String)
  async sendNewPassword(@Args("email", { type: () => String }) email: string) {
    // 유저 생성 전에 이메일 중복 체크

    const findUser = await this.usersService.findOneByEmail({ email });
    if (!findUser) throw new Error("등록되지 않은 이메일입니다.");

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
    if (cacheEmailToken !== emailToken)
      throw new Error("인증번호가 일치하지 않습니다.");
    return "인증되었습니다.";
  }
}
