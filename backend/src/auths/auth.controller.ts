import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { User } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { AuthsService } from "./auths.service";

interface IOAuthUser {
  user: Pick<User, "email" | "password" | "nickname">;
}

@Controller()
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthsService
  ) {}

  @Get("/login/google")
  @UseGuards(AuthGuard("google"))
  async loginGoogle(
    @Req() req: Request & IOAuthUser, //
    @Res() res: Response
  ) {
    await this.authService.socialLogin({ req, res });
  }

  @Get("/login/naver")
  @UseGuards(AuthGuard("naver"))
  async loginNaver(
    @Req() req: Request & IOAuthUser, //
    @Res() res: Response
  ) {
    this.authService.socialLogin({ req, res });
  }

  @Get("/login/kakao")
  @UseGuards(AuthGuard("kakao"))
  async loginKakao(
    @Req() req: Request & IOAuthUser, //
    @Res() res: Response
  ) {
    this.authService.socialLogin({ req, res });
  }
}
