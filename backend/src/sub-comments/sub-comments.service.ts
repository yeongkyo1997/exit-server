import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubComment } from "./entities/sub-comment.entity";

@Injectable()
export class SubCommentsService {
  constructor(
    @InjectRepository(SubComment)
    private readonly subCommentRepository: Repository<SubComment>
  ) {}

  async findAll({ userId, commentId }) {
    return await this.subCommentRepository.find({
      where: {
        user: { id: userId },
        comment: { id: commentId },
      },
      relations: ["comment", "user"],
      order: { createdAt: "ASC" },
    });
  }

  async create({ createSubCommentInput }) {
    const { subComment, userId, commentId } = createSubCommentInput;
    return await this.subCommentRepository.save({
      subComment,
      user: userId,
      comment: commentId,
    });
  }

  async update({ updateSubCommentInput }) {
    const { subComment, userId, commentId } = updateSubCommentInput;
    await this.subCommentRepository.update(
      {
        user: { id: userId },
        comment: { id: commentId },
      },
      { subComment }
    );
    return "대댓글 업데이트 완료!";
  }

  async remove({ userId, commentId }) {
    const deleteData = await this.subCommentRepository.find({
      where: {
        user: { id: userId },
        comment: { id: commentId },
      },
      relations: ["comment", "user"],
    });

    const showResult = [];
    for (let i = 0; i < deleteData.length; i++) {
      const result = await this.subCommentRepository.softDelete({
        id: deleteData[i].id,
      });
      showResult.push(
        result.affected
          ? `${deleteData[i].id} deleted`
          : `${deleteData[i].id} delete fail`
      );
    }
    return showResult;
  }
}
