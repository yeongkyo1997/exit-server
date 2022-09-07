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
  async uploadTagImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return await this.tagImagesService.create({ image });
  }

  @Query(() => TagImage)
  fetchTagImage(
    @Args("tagImageId") tagImageId: string //
  ) {
    return this.tagImagesService.findOne({ tagImageId });
  }

  @Query(() => [TagImage])
  fetchTagImages() {
    return this.tagImagesService.findAll();
  }

  @Mutation(() => TagImage)
  updateTagImage(
    @Args("tagImageId") tagImageId: string, //
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.tagImagesService.update({ tagImageId, image });
  }

  @Mutation(() => Boolean)
  removeTagImage(
    @Args({ name: "tagImageId", type: () => String }) tagImageId: string //
  ) {
    return this.tagImagesService.delete({ tagImageId });
  }
}
