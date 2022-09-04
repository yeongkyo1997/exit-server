import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { LikesService } from "./likes.service";
import { Like } from "./entities/like.entity";
import { CreateLikeInput } from "./dto/create-like.input";

@Resolver(() => Like)
export class LikesResolver {
  constructor(
    private readonly likesService: LikesService //
  ) {}

  @Query(() => [Like])
  fetchLikes(
    @Args("userId", { nullable: true }) userId: string, //
    @Args("boardId", { nullable: true }) boardId: string
  ) {
    return this.likesService.findAll({ userId, boardId });
  }

  @Mutation(() => String)
  createOrDeleteLike(
    @Args("createLikeInput") createLikeInput: CreateLikeInput //
  ) {
    return this.likesService.create({ createLikeInput });
  }
}
