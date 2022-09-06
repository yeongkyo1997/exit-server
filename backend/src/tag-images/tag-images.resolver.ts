import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { TagImage } from "./entities/tag-image.entity";
import { TagImagesService } from "./tag-images.service";

@Resolver(() => TagImage)
export class TagImagesResolver {
  constructor(
    private readonly tagImagesService: TagImagesService //
  ) {}

  @Mutation(() => TagImage)
  async uploadImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return await this.tagImagesService.create({ image });
  }

  @Query(() => TagImage)
  fetchImage(
    @Args("tagImageId") tagImageId: string //
  ) {
    return this.tagImagesService.findOne({ tagImageId });
  }

  @Query(() => [TagImage])
  fetchImages() {
    return this.tagImagesService.findAll();
  }

  @Mutation(() => TagImage)
  updateImage(
    @Args("tagImageId") tagImageId: string, //
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.tagImagesService.update({ tagImageId, image });
  }

  @Mutation(() => Boolean)
  removeImage(
    @Args({ name: "tagImageId", type: () => String }) tagImageId: string //
  ) {
    return this.tagImagesService.delete({ tagImageId });
  }
}
