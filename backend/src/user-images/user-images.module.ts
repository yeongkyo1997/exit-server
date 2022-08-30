import { Module } from '@nestjs/common';
import { UserImagesService } from './user-images.service';
import { UserImagesResolver } from './user-images.resolver';

@Module({
  providers: [UserImagesResolver, UserImagesService]
})
export class UserImagesModule {}
