import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserUrlsService } from "./user-urls.service";
import { UserUrl } from "./entities/user-url.entity";
import { CreateUserUrlInput } from "./dto/create-user-url.input";
import { UpdateUserUrlInput } from "./dto/update-user-url.input";

@Resolver(() => UserUrl)
export class UserUrlsResolver {
  constructor(private readonly userUrlsService: UserUrlsService) {}

  @Mutation(() => UserUrl)
  createUserUrl(
    @Args("createUserUrlInput") createUserUrlInput: CreateUserUrlInput
  ) {
    return this.userUrlsService.create(createUserUrlInput);
  }

  @Query(() => [UserUrl], { name: "userUrls" })
  findAll() {
    return this.userUrlsService.findAll();
  }

  @Query(() => UserUrl, { name: "userUrl" })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.userUrlsService.findOne(id);
  }

  @Mutation(() => UserUrl)
  updateUserUrl(
    @Args("updateUserUrlInput") updateUserUrlInput: UpdateUserUrlInput
  ) {
    return this.userUrlsService.update(
      updateUserUrlInput.id,
      updateUserUrlInput
    );
  }

  @Mutation(() => UserUrl)
  removeUserUrl(@Args("id", { type: () => String }) id: string) {
    return this.userUrlsService.remove(id);
  }
}
