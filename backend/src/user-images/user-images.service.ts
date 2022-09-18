import { Injectable, UnprocessableEntityException } from "@nestjs/common";
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
    return url[0].toString();
  }

  async findOne({ userImageId }) {
    return await this.userImageRepository.findOne({
      where: { id: userImageId },
    });
  }

  async findAll() {
    return await this.userImageRepository.find({});
  }

  async delete({ userImageId }) {
    const userImage = await this.userImageRepository.findOne({
      where: { id: userImageId },
    });
    if (!userImage) {
      throw new UnprocessableEntityException("존재하지 않는 이미지입니다.");
    }
    const result = await this.userImageRepository.softDelete({
      id: userImageId,
    });
    return result.affected ? true : false;
  }
}
