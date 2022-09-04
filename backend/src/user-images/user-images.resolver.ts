import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserImagesService } from "./user-images.service";
import { UserImage } from "./entities/user-image.entity";
import { CreateUserImageInput } from "./dto/create-user-image.input";
import { UpdateUserImageInput } from "./dto/update-user-image.input";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { isReadable } from "stream";

@Resolver(() => UserImage)
export class UserImagesResolver {
  constructor(
    private readonly userImagesService: UserImagesService //
  ) {}

  @Mutation(() => UserImage)
  async uploadImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return await this.userImagesService.create({ image });
  }

  @Query(() => UserImage)
  fetchImage(
    @Args("userImageId") userImageId: string //
  ) {
    return this.userImagesService.findOne({ userImageId });
  }

  @Query(() => [UserImage])
  fetchImages() {
    return this.userImagesService.findAll();
  }

  @Mutation(() => UserImage)
  updateImage(
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
