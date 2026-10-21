import { Module } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CommentsResolver } from "./comments.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "./entities/comment.entity";
import { SubCommentsModule } from "src/sub-comments/sub-comments.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment, //
    ]),
    SubCommentsModule,
  ],
  providers: [
    CommentsResolver, //
    CommentsService,
  ],
})
export class CommentsModule {}
