import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FilesService } from "src/files/files.service";
import { Repository } from "typeorm";
import { BoardImage } from "./entities/board-image.entity";

@Injectable()
export class BoardImagesService {
  constructor(
    @InjectRepository(BoardImage)
    private readonly boardImageRepository: Repository<BoardImage>,

    private readonly filesService: FilesService
  ) {}

  async create({ image }) {
    const url = await this.filesService.upload({ file: image, type: "board" });
    return url[0].toString();
  }

  async findOne({ boardImageId }) {
    return await this.boardImageRepository.findOne({
      where: { id: boardImageId },
    });
  }

  async findAll() {
    return await this.boardImageRepository.find({});
  }

  async delete({ boardImageId }) {
    const boardImage = await this.boardImageRepository.findOne({
      where: { id: boardImageId },
    });
    if (!boardImage) {
      throw new UnprocessableEntityException("존재하지 않는 이미지입니다.");
    }
    const result = await this.boardImageRepository.softDelete({
      id: boardImageId,
    });
    return result.affected ? true : false;
  }
}
