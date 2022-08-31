import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateBoardInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
