import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardImagesService } from "./board-images.service";
import { BoardImage } from "./entities/board-image.entity";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@Resolver(() => BoardImage)
export class BoardImagesResolver {
  constructor(
    private readonly boardImagesService: BoardImagesService //
  ) {}

  @Mutation(() => BoardImage)
  async uploadBoardImage(
    @Args({ name: "images", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return await this.boardImagesService.create({ image });
  }

  @Query(() => BoardImage)
  fetchBoardImage(
    @Args("boardImageId") boardImageId: string //
  ) {
    return this.boardImagesService.findOne({ boardImageId });
  }

  @Query(() => [BoardImage])
  fetchBoardImages() {
    return this.boardImagesService.findAll();
  }

  @Mutation(() => BoardImage)
  updateBoardImage(
    @Args("boardImageId") boardImageId: string, //
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.boardImagesService.update({ boardImageId, image });
  }

  @Mutation(() => Boolean)
  removeBoardImage(
    @Args({ name: "boardImageId", type: () => String }) boardImageId: string //
  ) {
    return this.boardImagesService.delete({ boardImageId });
  }
}
