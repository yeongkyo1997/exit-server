import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
    const comments = await this.commentRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user", "user.userImage"],
      order: { createdAt: "ASC" },
    });

    // 버그 유지: 작성자가 soft-delete된 댓글은 user가 null이라 여기서 TypeError
    comments.map((comment) => comment.user.id);

    return comments;
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
    // commentId가 없으면 where 조건이 빠져 모든 대댓글이 지워진다
    if (!commentId) throw new BadRequestException("commentId가 필요합니다.");

    // 본인 댓글인지 먼저 확인한 뒤에만 대댓글을 지운다
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, user: { id: userId } },
    });
    if (!comment)
      throw new NotFoundException("삭제할 수 있는 댓글이 없습니다.");

    // 관련 subComment도 다 지워준 뒤 comment 지우기
    await this.subCommentsService.removeAll({ commentId: comment.id });

    const result = await this.commentRepository.softDelete({
      id: comment.id,
      user: { id: userId },
    });

    return result.affected
      ? `${commentId} deleted`
      : `${commentId} delete fail`;
  }
}
