import { Injectable } from '@nestjs/common';
import { CreateUserImageInput } from './dto/create-user-image.input';
import { UpdateUserImageInput } from './dto/update-user-image.input';

@Injectable()
export class UserImagesService {
  create(createUserImageInput: CreateUserImageInput) {
    return 'This action adds a new userImage';
  }

  findAll() {
    return `This action returns all userImages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userImage`;
  }

  update(id: number, updateUserImageInput: UpdateUserImageInput) {
    return `This action updates a #${id} userImage`;
  }

  remove(id: number) {
    return `This action removes a #${id} userImage`;
  }
}
