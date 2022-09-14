import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardImagesService } from "./board-images.service";
import { BoardImage } from "./entities/board-image.entity";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@Resolver()
export class BoardImagesResolver {
  constructor(
    private readonly boardImagesService: BoardImagesService //
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

  // @Mutation(() => Boolean)
  // removeBoardImage(
  //   @Args({ name: "url", type: () => [String] }) url: string[] //
  // ) {
  //   return this.boardImagesService.delete({ url });
  // }
}
