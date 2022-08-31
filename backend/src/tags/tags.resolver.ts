import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { TagsService } from "./tags.service";
import { Tag } from "./entities/tag.entity";
import { CreateTagInput } from "./dto/create-tag.input";
import { UpdateTagInput } from "./dto/update-tag.input";

@Resolver(() => Tag)
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  @Mutation(() => Tag)
  createTag(@Args("createTagInput") createTagInput: CreateTagInput) {
    return this.tagsService.create(createTagInput);
  }

  @Query(() => [Tag], { name: "tags" })
  findAll() {
    return this.tagsService.findAll();
  }

  @Query(() => Tag, { name: "tag" })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.tagsService.findOne(id);
  }

  @Mutation(() => Tag)
  updateTag(@Args("updateTagInput") updateTagInput: UpdateTagInput) {
    return this.tagsService.update(updateTagInput.id, updateTagInput);
  }

  @Mutation(() => Tag)
  removeTag(@Args("id", { type: () => String }) id: string) {
    return this.tagsService.remove(id);
  }
}
