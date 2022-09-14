import { Injectable } from "@nestjs/common";
import { Storage } from "@google-cloud/storage";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserImage } from "./entities/user-image.entity";
import { FilesService } from "src/files/files.service";

@Injectable()
export class UserImagesService {
  constructor(
    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>,

    private readonly filesService: FilesService
  ) {}

  async create({ image }) {
    const url = await this.filesService.upload({ file: image, type: "user" });
    return url;
  }

  async findOne({ userImageId }) {
    await this.userImageRepository.findOne({
      where: { id: userImageId },
    });
  }

  async findAll() {
    await this.userImageRepository.find({});
  }

  // async delete({ userImageId }) {
  //   const result = await this.userImageRepository.softDelete({
  //     id: userImageId,
  //   });
  //   return result.affected ? true : false;
  // }
}
