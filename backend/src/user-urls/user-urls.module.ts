import { Module } from "@nestjs/common";
import { UserUrlsService } from "./user-urls.service";
import { UserUrlsResolver } from "./user-urls.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserUrl } from "./entities/user-url.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserUrl, //
    ]),
  ],
  providers: [
    UserUrlsResolver, //
    UserUrlsService,
  ],
})
export class UserUrlsModule {}
