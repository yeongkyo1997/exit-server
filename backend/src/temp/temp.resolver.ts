import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { TempService } from "./temp.service";

@Resolver()
export class TempResolver {
  constructor(
    private readonly tempService: TempService //
  ) {}

  @Mutation(() => Boolean)
  async temp(
    @Args("tagName", { type: () => [String] }) tagName: string[], //
    @Args("categoryName") categoryName: string
  ) {
    return this.tempService.temp({ tagName, categoryName });
  }

	@Mutation(() => Boolean)
	async delete() {
		return this.tempService.delete();
	}
}

