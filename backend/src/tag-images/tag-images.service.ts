import { Injectable } from '@nestjs/common';
import { CreateTagImageInput } from './dto/create-tag-image.input';
import { UpdateTagImageInput } from './dto/update-tag-image.input';

@Injectable()
export class TagImagesService {
  create(createTagImageInput: CreateTagImageInput) {
    return 'This action adds a new tagImage';
  }

  findAll() {
    return `This action returns all tagImages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tagImage`;
  }

  update(id: number, updateTagImageInput: UpdateTagImageInput) {
    return `This action updates a #${id} tagImage`;
  }

  remove(id: number) {
    return `This action removes a #${id} tagImage`;
  }
}
