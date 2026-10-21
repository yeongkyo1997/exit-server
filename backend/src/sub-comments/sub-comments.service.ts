import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { SubComment } from "./entities/sub-comment.entity";

@Injectable()
export class SubCommentsService {
  constructor(
    @InjectRepository(SubComment)
    private readonly subCommentRepository: Repository<SubComment>
  ) {}

  async findAll({ userId, commentId }) {
    const subComments = await this.subCommentRepository.find({
      where: {
        user: { id: userId },
        comment: { id: commentId },
      },
      relations: ["comment", "user", "user.userImage"],
      order: { createdAt: "ASC" },
    });

    // 버그 유지: 작성자가 soft-delete된 대댓글은 user가 null이라 여기서 TypeError
    subComments.map((subComment) => subComment.user.id);

    return subComments;
  }

  async create({ userId, createSubCommentInput }) {
    const { subComment, commentId } = createSubCommentInput;
    return await this.subCommentRepository.save({
      subComment,
      user: userId,
      comment: commentId,
    });
  }

  async update({ userId, updateSubCommentInput }) {
    const { subComment, commentId, subCommentId } = updateSubCommentInput;
    await this.subCommentRepository.update(
      {
        id: subCommentId,
        user: { id: userId },
        comment: { id: commentId },
      },
      { subComment }
    );
    return "대댓글 업데이트 완료!";
  }

  async remove({ userId, commentId, subCommentId }) {
    const result = await this.subCommentRepository.softDelete({
      id: subCommentId,
      user: { id: userId },
      comment: { id: commentId },
    });
    return result.affected
      ? `${subCommentId} deleted`
      : `${subCommentId} delete fail`;
  }

  async removeAll({ commentId }) {
    // commentId가 없으면 where 조건이 빠져 모든 대댓글이 조회되므로 아무것도 지우지 않는다
    if (!commentId) return [];

    const subComments = await this.subCommentRepository.find({
      select: { id: true },
      where: { comment: { id: commentId } },
    });
    const ids = subComments.map((subComment) => subComment.id);
    if (ids.length) await this.subCommentRepository.softDelete({ id: In(ids) });
    return ids;
  }
}
