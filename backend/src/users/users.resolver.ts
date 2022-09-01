import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import * as bcrypt from "bcrypt";

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  async createUser(@Args("createUserInput") createUserInput: CreateUserInput) {
    const { password, ...rest } = createUserInput;

    const hashedPassword = await bcrypt.hash(password, 10.2);

    return this.usersService.create({
      createUserInput,
      password: hashedPassword,
    });
  }

  @Query(() => [User])
  fetchUsers() {
    return this.usersService.findAll();
  }

  @Query(() => User)
  fetchUser(@Args("userId", { type: () => String }) userId: string) {
    return this.usersService.findOne({ userId });
  }

  @Mutation(() => User)
  removeUser(@Args("userId", { type: () => String }) userId: string) {
    return this.usersService.remove({ userId });
  }

  @Mutation(() => User)
  updateUser(
    @Args("userId") userId: string,
    @Args("updateUserInput") updateUserInput: UpdateUserInput
  ) {
    return this.usersService.update({ userId, updateUserInput });
  }
}
