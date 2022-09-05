import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardImagesService } from "./board-images.service";
import { BoardImage } from "./entities/board-image.entity";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@Resolver(() => BoardImage)
export class BoardImagesResolver {
  constructor(private readonly boardImagesService: BoardImagesService) {}

  @Mutation(() => BoardImage)
  async uploadImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return await this.boardImagesService.create({ image });
  }

  @Query(() => BoardImage)
  fetchImage(
    @Args("boardImageId") boardImageId: string //
  ) {
    return this.boardImagesService.findOne({ boardImageId });
  }

  @Query(() => [BoardImage])
  fetchImages() {
    return this.boardImagesService.findAll();
  }

  @Mutation(() => BoardImage)
  updateImage(
    @Args("boardImageId") boardImageId: string, //
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.boardImagesService.update({ boardImageId, image });
  }

  @Mutation(() => Boolean)
  removeImage(
    @Args({ name: "boardImageId", type: () => String }) boardImageId: string //
  ) {
    return this.boardImagesService.delete({ boardImageId });
  }
}
