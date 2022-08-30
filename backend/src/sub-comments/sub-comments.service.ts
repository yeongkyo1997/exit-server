import { Injectable } from '@nestjs/common';
import { CreateSubCommentInput } from './dto/create-sub-comment.input';
import { UpdateSubCommentInput } from './dto/update-sub-comment.input';

@Injectable()
export class SubCommentsService {
  create(createSubCommentInput: CreateSubCommentInput) {
    return 'This action adds a new subComment';
  }

  findAll() {
    return `This action returns all subComments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subComment`;
  }

  update(id: number, updateSubCommentInput: UpdateSubCommentInput) {
    return `This action updates a #${id} subComment`;
  }

  remove(id: number) {
    return `This action removes a #${id} subComment`;
  }
}
