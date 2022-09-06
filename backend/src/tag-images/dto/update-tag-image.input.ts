import { CreateTagImageInput } from './create-tag-image.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateTagImageInput extends PartialType(CreateTagImageInput) {
  @Field(() => Int)
  id: number;
}
