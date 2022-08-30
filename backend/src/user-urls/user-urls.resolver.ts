import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserUrlsService } from './user-urls.service';
import { UserUrl } from './entities/user-url.entity';
import { CreateUserUrlInput } from './dto/create-user-url.input';
import { UpdateUserUrlInput } from './dto/update-user-url.input';

@Resolver(() => UserUrl)
export class UserUrlsResolver {
  constructor(private readonly userUrlsService: UserUrlsService) {}

  @Mutation(() => UserUrl)
  createUserUrl(@Args('createUserUrlInput') createUserUrlInput: CreateUserUrlInput) {
    return this.userUrlsService.create(createUserUrlInput);
  }

  @Query(() => [UserUrl], { name: 'userUrls' })
  findAll() {
    return this.userUrlsService.findAll();
  }

  @Query(() => UserUrl, { name: 'userUrl' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.userUrlsService.findOne(id);
  }

  @Mutation(() => UserUrl)
  updateUserUrl(@Args('updateUserUrlInput') updateUserUrlInput: UpdateUserUrlInput) {
    return this.userUrlsService.update(updateUserUrlInput.id, updateUserUrlInput);
  }

  @Mutation(() => UserUrl)
  removeUserUrl(@Args('id', { type: () => Int }) id: number) {
    return this.userUrlsService.remove(id);
  }
}
