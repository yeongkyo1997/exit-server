import { CreateSubCommentInput } from './create-sub-comment.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateSubCommentInput extends PartialType(CreateSubCommentInput) {
  @Field(() => Int)
  id: number;
}
