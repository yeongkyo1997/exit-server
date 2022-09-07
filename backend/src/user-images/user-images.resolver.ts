import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserImagesService } from "./user-images.service";
import { UserImage } from "./entities/user-image.entity";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@Resolver(() => UserImage)
export class UserImagesResolver {
  constructor(
    private readonly userImagesService: UserImagesService //
  ) {}

  @Mutation(() => UserImage)
  async uploadUserImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return await this.userImagesService.create({ image });
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

  @Mutation(() => UserImage)
  updateUserImage(
    @Args("userImageId") userImageId: string, //
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.userImagesService.update({ userImageId, image });
  }

  @Mutation(() => Boolean)
  removeImage(
    @Args({ name: "userImageId", type: () => String }) userImageId: string //
  ) {
    return this.userImagesService.delete({ userImageId });
  }
}
