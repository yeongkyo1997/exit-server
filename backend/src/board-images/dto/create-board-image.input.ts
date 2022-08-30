import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateBoardImageInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
