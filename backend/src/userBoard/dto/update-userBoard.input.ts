import { CreateUserBoardInput } from "./create-userBoard.input";
import { InputType, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateUserBoardInput extends PartialType(CreateUserBoardInput) {}
