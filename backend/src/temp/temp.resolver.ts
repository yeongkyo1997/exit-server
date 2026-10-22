import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import {
  GqlAdminGuard,
  GqlAuthAccessGuard,
} from "src/commons/auth/gql-auth.guard";
import { TempService } from "./temp.service";

@Resolver()
export class TempResolver {
  constructor(
    private readonly tempService: TempService //
  ) {}

  // 시드·초기화용 개발 도구라 운영자만 쓸 수 있다 (ADMIN_USER_IDS, 비어 있으면 아무도 못 씀)
  @UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
  @Mutation(() => Boolean)
  async temp(
    @Args("tagName", { type: () => [String] }) tagName: string[], //
    @Args("categoryName") categoryName: string
  ) {
    return this.tempService.temp({ tagName, categoryName });
  }

	@UseGuards(GqlAuthAccessGuard, GqlAdminGuard)
	@Mutation(() => Boolean)
	async delete() {
		return this.tempService.delete();
	}
}

