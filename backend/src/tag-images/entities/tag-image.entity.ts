import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TagImage {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
