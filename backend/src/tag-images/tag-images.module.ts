import { Module } from '@nestjs/common';
import { TagImagesService } from './tag-images.service';
import { TagImagesResolver } from './tag-images.resolver';

@Module({
  providers: [TagImagesResolver, TagImagesService]
})
export class TagImagesModule {}
