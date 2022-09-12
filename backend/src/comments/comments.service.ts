import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SubCommentsService } from "src/sub-comments/sub-comments.service";
import { Repository } from "typeorm";
import { Comment } from "./entities/comment.entity";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly subCommentsService: SubCommentsService
  ) {}

  async findAll({ userId, boardId }) {
    return await this.commentRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
      order: { createdAt: "ASC" },
    });
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
