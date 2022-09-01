import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserImagesService } from "./user-images.service";
import { UserImage } from "./entities/user-image.entity";
import { CreateUserImageInput } from "./dto/create-user-image.input";
import { UpdateUserImageInput } from "./dto/update-user-image.input";

@Resolver(() => UserImage)
export class UserImagesResolver {
  constructor(private readonly userImagesService: UserImagesService) {}

  @Mutation(() => UserImage)
  createUserImage(
    @Args("createUserImageInput") createUserImageInput: CreateUserImageInput
  ) {
    return this.userImagesService.create(createUserImageInput);
  }

  @Query(() => [UserImage])
  findAll() {
    return this.userImagesService.findAll();
  }

  @Query(() => UserImage)
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.userImagesService.findOne(id);
  }

  @Mutation(() => UserImage)
  updateUserImage(
    @Args("userId") userId: string,
    @Args("updateUserImageInput") updateUserImageInput: UpdateUserImageInput
  ) {
    return this.userImagesService.update(
      userId,
      updateUserImageInput
    );
  }

  @Mutation(() => UserImage)
  removeUserImage(@Args("id", { type: () => String }) id: string) {
    return this.userImagesService.remove(id);
  }
}
