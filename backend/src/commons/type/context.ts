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
}
