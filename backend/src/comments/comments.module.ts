import { Module } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CommentsResolver } from "./comments.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "./entities/comment.entity";
import { SubCommentsService } from "src/sub-comments/sub-comments.service";
import { User } from "src/users/entities/user.entity";
import { SubComment } from "src/sub-comments/entities/sub-comment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment, //
      User,
      SubComment,
    ]),
  ],
  providers: [
    CommentsResolver, //
    CommentsService,
    SubCommentsService,
  ],
})
export class CommentsModule {}
