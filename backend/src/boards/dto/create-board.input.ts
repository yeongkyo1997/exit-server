import { InputType, Field, Int } from "@nestjs/graphql";
import { CreateBoardImageInput } from "src/board-images/dto/create-board-image.input";
import { Max, Min } from "class-validator";

@InputType()
export class CreateBoardInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  context: string;

  @Max(6)
  @Field(() => Int)
  totalMember: number;

  @Field(() => String)
  description: string;

  @Field(() => String)
  leader: string;

  @Min(50000)
  @Field(() => Int)
  bail: number;

  @Field(() => String, { nullable: true })
  projectUrl?: string;

  @Field(() => Boolean, { nullable: true })
  status: boolean;

  @Field(() => Boolean, { nullable: true })
  isSuccess: boolean;

  @Field(() => String)
  address: string;

  @Field(() => Date)
  startAt: Date;

  @Field(() => Date)
  endAt: Date;

  @Field(() => CreateBoardImageInput, { nullable: true })
  image?: CreateBoardImageInput;

  @Field(() => [String])
  tags: string[];

  @Field(() => [String], { nullable: true })
  keywords?: string[];

  @Field(() => [String], { nullable: true })
  categories?: string[];
}
