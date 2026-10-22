import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { CategoriesService } from "./categories.service";
import { Category } from "./entities/category.entity";
import { CreateCategoryInput } from "./dto/create-category.input";
import { UpdateCategoryInput } from "./dto/update-category.input";
import { UseGuards } from "@nestjs/common";
import {
  GqlAdminGuard,
  GqlAuthAccessGuard,
} from "src/commons/auth/gql-auth.guard";

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(
    private readonly categoriesService: CategoriesService //
  ) {}

  @Query(() => [Category])
  fetchCategories() {
    return this.categoriesService.findAll();
  }

  @Query(() => Category)
  fetchCategory(
    @Args("id", { type: () => String }) id: string //
  ) {
    return this.categoriesService.findOne(id);
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Category)
  createCategory(
    @Args("createCategoryInput") createCategoryInput: CreateCategoryInput
  ) {
    return this.categoriesService.create(createCategoryInput);
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Category)
  updateCategory(
    @Args("updateCategoryInput") updateCategoryInput: UpdateCategoryInput
  ) {
    return this.categoriesService.update(
      updateCategoryInput.id,
      updateCategoryInput
    );
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Boolean)
  removeCategory(
    @Args("name", { type: () => String }) name: string //
  ) {
    return this.categoriesService.remove({ name });
  }

  // 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Category)
  restoreCategory(
    @Args("id", { type: () => String }) id: string //
  ) {
    return this.categoriesService.restore(id);
  }
}
