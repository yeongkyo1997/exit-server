import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateBoardImageInput {
  @Field(() => String, { description: "Example field (placeholder)" })
  id: string;
}
