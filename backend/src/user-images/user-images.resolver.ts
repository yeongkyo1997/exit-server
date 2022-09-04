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

  @Mutation(() => [UserImage])
  async uploadImage(
    @Args({ name: "images", type: () => [GraphQLUpload] }) images: FileUpload[]
  ) {
    return await this.userImagesService.create({ images });
  }

  @Query(() => UserImage)
  fetchImage(
    @Args({ name: "image", type: () => [GraphQLUpload] }) image: FileUpload[]
  ) {
    return this.userImagesService.findOne({ image });
  }

  @Query(() => [UserImage])
  fetchImages(
    @Args({ name: "images", type: () => [GraphQLUpload] }) images: FileUpload[]
  ) {
    return this.userImagesService.findAll({ images });
  }

  updateImage(
    @Args({ name: "images", type: () => [GraphQLUpload] }) images: FileUpload[]
  ) {
    return this.userImagesService.update({ images });
  }

  removeImage(
    @Args({ name: "images", type: () => [GraphQLUpload] }) images: FileUpload[]
  ) {
    return this.userImagesService.delete({ images });
  }
}
