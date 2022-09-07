import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileUploadsService } from "src/fileUpload/fileUpload.service";
import { TagImage } from "./entities/tag-image.entity";

@Injectable()
export class TagImagesService {
  constructor(
    @InjectRepository(TagImage)
    private readonly tagImageRepository: Repository<TagImage>,

    private readonly fileUploadsService: FileUploadsService
  ) {}

  async create({ image }) {
    const url = await this.fileUploadsService.upload({ file: image });

    const result = await this.tagImageRepository.save({ url: url.toString() });
    return result;
  }

  async findOne({ tagImageId }) {
    await this.tagImageRepository.findOne({
      where: { id: tagImageId },
    });
  }

  async findAll() {
    await this.tagImageRepository.find({});
  }

  async update({ tagImageId, image }) {
    await this.tagImageRepository.softDelete({ id: tagImageId });

    const url = await this.fileUploadsService.upload({ file: image });

    const result = await this.tagImageRepository.save({ url: url.toString() });
    return result;
  }

  async delete({ tagImageId }) {
    const result = await this.tagImageRepository.softDelete({
      id: tagImageId,
    });
    return result.affected ? true : false;
  }
}
