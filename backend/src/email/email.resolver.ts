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
  async sendEmailToken(@Args("email", { type: () => String }) email: string) {
    // 유저 생성 전에 이메일 중복 체크
    const findUser = await this.usersService.checkDuplicateEmail({ email });
    if (findUser) throw new Error("이미 등록된 이메일입니다.");

    // 6자리 이메일 토큰 생성
    const emailToken = Math.random().toString().substring(2, 8);
    await this.cacheManager.set(email, emailToken, { ttl: 0 });
    this.cacheManager.get(email).then((res) => console.log(res));
    this.emailService.sendEmailToken({ email, emailToken });
    return "이메일을 보냈습니다.";
  }
}
