import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { TagsService } from "./tags.service";
import { Tag } from "./entities/tag.entity";
import { CreateTagInput } from "./dto/create-tag.input";
import { UpdateTagInput } from "./dto/update-tag.input";
import { UseGuards } from "@nestjs/common";
import {
  GqlAdminGuard,
  GqlAuthAccessGuard,
} from "src/commons/auth/gql-auth.guard";

@Resolver(() => Tag)
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Tag)
  createTag(@Args("createTagInput") createTagInput: CreateTagInput) {
    return this.tagsService.create(createTagInput);
  }

  @Query(() => [Tag])
  fetchTags() {
    return this.tagsService.findAll();
  }

  @Query(() => Tag)
  fetchTag(@Args("id", { type: () => String }) id: string) {
    return this.tagsService.findOne(id);
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Tag)
  updateTag(@Args("updateTagInput") updateTagInput: UpdateTagInput) {
    return this.tagsService.update(updateTagInput.id, updateTagInput);
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Boolean)
  removeTag(@Args("name", { type: () => String }) name: string) {
    return this.tagsService.remove({ name });
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Tag)
  restoreTag(@Args("id", { type: () => String }) id: string) {
    return this.tagsService.restore(id);
  }
}
