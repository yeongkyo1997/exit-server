import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TagImagesService } from './tag-images.service';
import { TagImage } from './entities/tag-image.entity';
import { CreateTagImageInput } from './dto/create-tag-image.input';
import { UpdateTagImageInput } from './dto/update-tag-image.input';

@Resolver(() => TagImage)
export class TagImagesResolver {
  constructor(private readonly tagImagesService: TagImagesService) {}

  @Mutation(() => TagImage)
  createTagImage(@Args('createTagImageInput') createTagImageInput: CreateTagImageInput) {
    return this.tagImagesService.create(createTagImageInput);
  }

  @Query(() => [TagImage], { name: 'tagImages' })
  findAll() {
    return this.tagImagesService.findAll();
  }

  @Query(() => TagImage, { name: 'tagImage' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.tagImagesService.findOne(id);
  }

  @Mutation(() => TagImage)
  updateTagImage(@Args('updateTagImageInput') updateTagImageInput: UpdateTagImageInput) {
    return this.tagImagesService.update(updateTagImageInput.id, updateTagImageInput);
  }

  @Mutation(() => TagImage)
  removeTagImage(@Args('id', { type: () => Int }) id: number) {
    return this.tagImagesService.remove(id);
  }
}
