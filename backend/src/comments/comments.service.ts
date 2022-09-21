import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SubCommentsService } from "src/sub-comments/sub-comments.service";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { Comment } from "./entities/comment.entity";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly subCommentsService: SubCommentsService
  ) {}

  async findAll({ userId, boardId }) {
    const commentData = await this.commentRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
      order: { createdAt: "ASC" },
      withDeleted: true,
    });

    if (userId) {
      const userData = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["userImage"],
      });
      for (let i = 0; i < commentData.length; i++) {
        commentData[i]["user"]["userImage"] = userData["userImage"];
      }
      return commentData;
    } else {
      for (let i = 0; i < commentData.length; i++) {
        const userData = await this.userRepository.findOne({
          where: { id: commentData[i]["user"]["id"] },
          relations: ["userImage"],
        });

        commentData[i]["user"]["userImage"] = userData["userImage"];
      }

      return commentData;
    }
  }

  async create({ userId, createCommentInput }) {
    const { comment, boardId } = createCommentInput;
    return await this.commentRepository.save({
      comment,
      user: userId,
      board: boardId,
    });
  }

  async update({ userId, updateCommentInput }) {
    const { comment, commentId, boardId } = updateCommentInput;
    await this.commentRepository.update(
      {
        id: commentId,
        user: { id: userId },
        board: { id: boardId },
      },
      { comment }
    );
    return "댓글 업데이트 완료!";
  }

  async remove({ commentId, userId }) {
    // 관련 subComment도 다 지워준 뒤 comment 지우기
    await this.subCommentsService.removeAll({ commentId });

    const result = await this.commentRepository.softDelete({
      id: commentId,
      user: { id: userId },
    });

    return result.affected
      ? `${commentId} deleted`
      : `${commentId} delete fail`;
  }
}
