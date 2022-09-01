import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import * as bcrypt from "bcrypt";
import { UseGuards } from "@nestjs/common";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";

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
  removeUser(@Args("email", { type: () => String }) email: string) {
    return this.usersService.remove({ email });
  }

  // 로그인한 user 정보 수정
  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => User)
  updateUser(
    @Context() context: any,
    @Args("updateUserInput") updateUserInput: UpdateUserInput
  ) {
    const email = context.req.user.email;
    return this.usersService.update({ email, updateUserInput });
  }
}
