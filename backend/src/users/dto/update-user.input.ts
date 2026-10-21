import { CreateUserInput } from "./create-user.input";
import { Field, InputType, OmitType, PartialType } from "@nestjs/graphql";

// email/password는 인증 절차가 있는 별도 mutation으로만 바꾸고, point는 결제·정산으로만 바뀐다
@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ["email", "password"] as const)
) {
  @Field(() => String, { nullable: true })
  userUrl: string;

  @Field(() => [String], { nullable: true })
  tags: string[];

  @Field(() => [String], { nullable: true })
  keywords: string[];

  @Field(() => [String], { nullable: true })
  categories: string[];
}
