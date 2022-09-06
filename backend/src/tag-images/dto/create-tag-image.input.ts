import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateTagImageInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
