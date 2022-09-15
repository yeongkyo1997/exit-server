import { Injectable } from "@nestjs/common";
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
    await this.boardImageRepository.findOne({
      where: { id: boardImageId },
    });
  }

  async findAll() {
    await this.boardImageRepository.find({});
  }

  // async delete({ url }) {
  //   try {
  //     for (let i = 0; i < url.length; i++) {
  //       const boardImage = await this.boardImageRepository.findOne({
  //         where: { url: url[i] },
  //       });
  //       await this.filesService.remove({ url });
  //       await this.boardImageRepository.softDelete({
  //         id: boardImage.id,
  //       });
  //     }
  //   } catch (error) {
  //     return false;
  //   }
  //   return true;
  // }
}
