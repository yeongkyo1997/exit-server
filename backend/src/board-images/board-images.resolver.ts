import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardImagesService } from "./board-images.service";
import { BoardImage } from "./entities/board-image.entity";
import { CreateBoardImageInput } from "./dto/create-board-image.input";
import { UpdateBoardImageInput } from "./dto/update-board-image.input";

@Resolver(() => BoardImage)
export class BoardImagesResolver {
  constructor(private readonly boardImagesService: BoardImagesService) {}

  @Mutation(() => BoardImage)
  createBoardImage(
    @Args("createBoardImageInput") createBoardImageInput: CreateBoardImageInput
  ) {
    return this.boardImagesService.create(createBoardImageInput);
  }

  @Query(() => [BoardImage], { name: "boardImages" })
  findAll() {
    return this.boardImagesService.findAll();
  }

  @Query(() => BoardImage, { name: "boardImage" })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.boardImagesService.findOne(id);
  }

  @Mutation(() => BoardImage)
  updateBoardImage(
    @Args("updateBoardImageInput") updateBoardImageInput: UpdateBoardImageInput
  ) {
    return this.boardImagesService.update(
      updateBoardImageInput.id,
      updateBoardImageInput
    );
  }

  @Mutation(() => BoardImage)
  removeBoardImage(@Args("id", { type: () => String }) id: string) {
    return this.boardImagesService.remove(id);
  }
}
