import { Module } from "@nestjs/common";
import { UserUrlsService } from "./user-urls.service";
import { UserUrlsResolver } from "./user-urls.resolver";

@Module({
  providers: [UserUrlsResolver, UserUrlsService],
})
export class UserUrlsModule {}
