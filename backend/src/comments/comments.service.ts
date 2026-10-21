import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
