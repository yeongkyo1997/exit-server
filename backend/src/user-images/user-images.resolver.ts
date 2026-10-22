import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserImagesService } from "./user-images.service";
import { UserImage } from "./entities/user-image.entity";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";

@Resolver(() => UserImage)
export class UserImagesResolver {
  constructor(
    private readonly userImagesService: UserImagesService //
  ) {}

  // 회원가입 화면이 로그인 전에 올릴 수 있어 비로그인도 허용한다.
  // 대신 첫 파일만 올리고, 이미지 형식·크기 제한은 FilesService가 건다
  @Mutation(() => String)
  async uploadUserImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return await this.userImagesService.create({ image: image.slice(0, 1) });
  }

  @Query(() => UserImage)
  fetchUserImage(
    @Args("userImageId") userImageId: string //
  ) {
    return this.userImagesService.findOne({ userImageId });
  }

  @Query(() => [UserImage])
  fetchUserImages() {
    return this.userImagesService.findAll();
  }

  // 본인 프로필 이미지만 지울 수 있다
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  removeImage(
    @Args({ name: "userImageId", type: () => String }) userImageId: string, //
    @CurrentUser() user: AuthUser
  ) {
    return this.userImagesService.delete({ userImageId, userId: user.id });
  }
}
