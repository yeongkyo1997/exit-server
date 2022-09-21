import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { SubComment } from "./entities/sub-comment.entity";

@Injectable()
export class SubCommentsService {
  constructor(
    @InjectRepository(SubComment)
    private readonly subCommentRepository: Repository<SubComment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll({ userId, commentId }) {
    const subCommentData = await this.subCommentRepository.find({
      where: {
        user: { id: userId },
        comment: { id: commentId },
      },
      relations: ["comment", "user"],
      order: { createdAt: "ASC" },
    });

    for (let i = 0; i < subCommentData.length; i++) {
      const userData = await this.userRepository.findOne({
        where: { id: subCommentData[i]["user"]["id"] },
        relations: ["userImage"],
      });

      subCommentData[i]["user"]["userImage"] = userData["userImage"];
    }

    return subCommentData;
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
    const deleteData = await this.subCommentRepository.find({
      where: { comment: { id: commentId } },
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
