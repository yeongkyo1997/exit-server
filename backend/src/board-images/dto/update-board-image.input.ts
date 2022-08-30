import { CreateBoardImageInput } from './create-board-image.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateBoardImageInput extends PartialType(CreateBoardImageInput) {
  @Field(() => Int)
  id: number;
}
