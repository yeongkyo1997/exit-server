import { InputType, Field, Int } from "@nestjs/graphql";
import { CreateBoardImageInput } from "src/board-images/dto/create-board-image.input";

@InputType()
export class CreateBoardInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  context: string;

  @Field(() => Int)
  num: number;

  @Field(() => String)
  description: string;

  @Field(() => String)
  leader: string;

  @Field(() => Int, { nullable: true })
  price: number;

  @Field(() => Date)
  startAt: Date;

  @Field(() => Date)
  endAt: Date;

  @Field(() => CreateBoardImageInput, { nullable: true })
  image?: CreateBoardImageInput;

  @Field(() => [String])
  tags: string[];

  @Field(() => [String])
  users: string[];

  @Field(() => [String], { nullable: true })
  keywords?: string[];
}
