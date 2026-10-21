import * as bcrypt from "bcrypt";
import { PASSWORD_SALT_ROUNDS } from "src/commons/constants";

export const hashPassword = (password: string) =>
  bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
