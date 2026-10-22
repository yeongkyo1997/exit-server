import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { BoardImagesService } from "./board-images.service";
import { BoardImage } from "./entities/board-image.entity";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";

@Resolver()
export class BoardImagesResolver {
  constructor(
    private readonly boardImagesService: BoardImagesService //
  ) {}

  // 썸네일은 게시글 작성·수정(로그인 필수) 화면에서만 올린다. 응답은 첫 URL 하나뿐이므로 첫 파일만 올린다
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => String)
  uploadBoardImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.boardImagesService.create({ image: image.slice(0, 1) });
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

  // 그 이미지를 썸네일로 쓰는 게시글의 리더만 지울 수 있다
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  removeBoardImage(
    @Args({ name: "boardImageId", type: () => String }) boardImageId: string, //
    @CurrentUser() user: AuthUser
  ) {
    return this.boardImagesService.delete({ boardImageId, userId: user.id });
  }
}
