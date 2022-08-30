import { Injectable } from '@nestjs/common';
import { CreateUserUrlInput } from './dto/create-user-url.input';
import { UpdateUserUrlInput } from './dto/update-user-url.input';

@Injectable()
export class UserUrlsService {
  create(createUserUrlInput: CreateUserUrlInput) {
    return 'This action adds a new userUrl';
  }

  findAll() {
    return `This action returns all userUrls`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userUrl`;
  }

  update(id: number, updateUserUrlInput: UpdateUserUrlInput) {
    return `This action updates a #${id} userUrl`;
  }

  remove(id: number) {
    return `This action removes a #${id} userUrl`;
  }
}
