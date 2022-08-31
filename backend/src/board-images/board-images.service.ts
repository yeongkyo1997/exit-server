import { Injectable } from "@nestjs/common";
import { CreateBoardImageInput } from "./dto/create-board-image.input";
import { UpdateBoardImageInput } from "./dto/update-board-image.input";

@Injectable()
export class BoardImagesService {
  create(createBoardImageInput: CreateBoardImageInput) {
    return "This action adds a new boardImage";
  }

  findAll() {
    return `This action returns all boardImages`;
  }

  findOne(id: string) {
    return `This action returns a #${id} boardImage`;
  }

  update(id: string, updateBoardImageInput: UpdateBoardImageInput) {
    return `This action updates a #${id} boardImage`;
  }

  remove(id: string) {
    return `This action removes a #${id} boardImage`;
  }
}
