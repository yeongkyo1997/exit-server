import { Injectable } from "@nestjs/common";
import { CreateLikeInput } from "./dto/create-like.input";
import { UpdateLikeInput } from "./dto/update-like.input";

@Injectable()
export class LikesService {
  create(createLikeInput: CreateLikeInput) {
    return "This action adds a new like";
  }

  findAll() {
    return `This action returns all likes`;
  }

  findOne(id: string) {
    return `This action returns a #${id} like`;
  }

  update(id: string, updateLikeInput: UpdateLikeInput) {
    return `This action updates a #${id} like`;
  }

  remove(id: string) {
    return `This action removes a #${id} like`;
  }
}
