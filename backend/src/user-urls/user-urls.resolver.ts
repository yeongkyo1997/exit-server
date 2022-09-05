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

  @Query(() => [UserUrl])
  findAll() {
    return this.userUrlsService.findAll();
  }

  @Query(() => UserUrl)
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.userUrlsService.findOne(id);
  }

  @Mutation(() => UserUrl)
  updateUserUrl(
    @Args("userId") userId: string,
    @Args("updateUserUrlInput") updateUserUrlInput: UpdateUserUrlInput
  ) {
    return this.userUrlsService.update(userId, updateUserUrlInput);
  }

  @Mutation(() => UserUrl)
  removeUserUrl(@Args("id", { type: () => String }) id: string) {
    return this.userUrlsService.remove(id);
  }
}
