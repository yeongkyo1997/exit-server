import { CreateUserImageInput } from './create-user-image.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUserImageInput extends PartialType(CreateUserImageInput) {
  @Field(() => Int)
  id: number;
}
