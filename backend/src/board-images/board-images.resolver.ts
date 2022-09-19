import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardImagesService } from "./board-images.service";
import { BoardImage } from "./entities/board-image.entity";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { FilesService } from "src/files/files.service";

@Resolver()
export class BoardImagesResolver {
  constructor(
    private readonly boardImagesService: BoardImagesService, //

    private readonly filesService: FilesService
  ) {}

  @Mutation(() => String)
  uploadBoardImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.boardImagesService.create({ image });
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

  @Mutation(() => Boolean)
  removeBoardImage(
    @Args({ name: "boardImageId", type: () => String }) boardImageId: string //
  ) {
    return this.boardImagesService.delete({ boardImageId });
  }

  // @Mutation(() => Boolean)
  // async deleteBoardImage(
  //   @Args("url") url: string //
  // ) {
  //   return await this.filesService.remove({ url });
  // }
}
