import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateSubCommentInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
