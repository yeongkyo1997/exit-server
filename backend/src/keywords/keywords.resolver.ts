import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { KeywordsService } from "./keywords.service";
import { Keyword } from "./entities/keyword.entity";
import { CreateKeywordInput } from "./dto/create-keyword.input";
import { UpdateKeywordInput } from "./dto/update-keyword.input";
import { UseGuards } from "@nestjs/common";
import {
  GqlAdminGuard,
  GqlAuthAccessGuard,
} from "src/commons/auth/gql-auth.guard";

@Resolver(() => Keyword)
export class KeywordsResolver {
  constructor(private readonly keywordsService: KeywordsService) {}

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Keyword)
  createKeyword(
    @Args("createKeywordInput") createKeywordInput: CreateKeywordInput
  ) {
    return this.keywordsService.create(createKeywordInput);
  }

  @Query(() => [Keyword])
  fetchKeywords() {
    return this.keywordsService.findAll();
  }

  @Query(() => Keyword)
  fetchKeyword(@Args("id", { type: () => String }) id: string) {
    return this.keywordsService.findOne(id);
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Keyword)
  updateKeyword(
    @Args("updateKeywordInput") updateKeywordInput: UpdateKeywordInput
  ) {
    return this.keywordsService.update(
      updateKeywordInput.id,
      updateKeywordInput
    );
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Keyword)
  removeKeyword(@Args("id", { type: () => String }) id: string) {
    return this.keywordsService.remove(id);
  }
}
