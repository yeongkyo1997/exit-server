import { CreateUserInput } from "./create-user.input";
import { Field, InputType, Int, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  //FE 실험용(나중에 최종 배포할 때는 없애야 함)

  @Field(() => String, { nullable: true })
  userUrl: string;

  @Field(() => Int, { nullable: true })
  point: number;

  @Field(() => [String], { nullable: true })
  tags: string[];

  @Field(() => [String], { nullable: true })
  keywords: string[];

  @Field(() => [String], { nullable: true })
  categories: string[];
}
