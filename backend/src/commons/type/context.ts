import { Request, Response } from "express";

// JWT 전략의 validate()가 req.user에 넣는 값
export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
}

export interface IUser {
  user: AuthUser;
}

export interface IContext {
  req?: Request & IUser;
  res?: Response;
  // 가드 없는 요청에서도 토큰으로 알아낸 요청자 (resolveViewer가 요청당 한 번만 계산해 둔다)
  viewer?: Promise<AuthUser | null>;
}
