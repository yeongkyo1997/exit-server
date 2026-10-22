import { CreateUserBoardInput } from "./create-userBoard.input";
import { Field, InputType, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateUserBoardInput extends PartialType(CreateUserBoardInput) {
  // 리더가 처리할 신청자의 user.id (2022-09-21 hotfix에서 CreateUserBoardInput과 함께 빠졌던 필드).
  // CreateUserBoardInput에는 넣지 않는다 (신청은 토큰의 user.id만 쓴다)
  @Field(() => String, { nullable: true })
  userId?: string;
}
