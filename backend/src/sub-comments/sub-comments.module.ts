import { Module } from "@nestjs/common";
import { SubCommentsService } from "./sub-comments.service";
import { SubCommentsResolver } from "./sub-comments.resolver";

@Module({
  providers: [SubCommentsResolver, SubCommentsService],
})
export class SubCommentsModule {}
