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

  async create({ createCommentInput }) {
    const { comment, userId, boardId } = createCommentInput;
    return await this.commentRepository.save({
      comment,
      user: userId,
      board: boardId,
    });
  }

  async update({ updateCommentInput }) {
    const { comment, userId, boardId } = updateCommentInput;
    await this.commentRepository.update(
      {
        user: { id: userId },
        board: { id: boardId },
      },
      { comment }
    );
    return "댓글 업데이트 완료!";
  }

  async remove({ userId, boardId }) {
    const deleteData = await this.commentRepository.find({
      where: {
        user: { id: userId },
        board: { id: boardId },
      },
      relations: ["board", "user"],
    });

    // 관련 subComment도 다 지워준 뒤 comment 지우기
    const showResult = [];
    for (let i = 0; i < deleteData.length; i++) {
      await this.subCommentsService.remove({
        userId,
        commentId: deleteData[i].id,
      });

      const result = await this.commentRepository.softDelete({
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
