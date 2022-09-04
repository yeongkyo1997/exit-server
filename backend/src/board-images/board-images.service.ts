import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BoardImage } from "./entities/board-image.entity";
import { Storage } from "@google-cloud/storage";

@Injectable()
export class BoardImagesService {
  constructor(
    @InjectRepository(BoardImage)
    private readonly boardImageRepository: Repository<BoardImage>
  ) {}

  async create({ image }) {
    const bucket = process.env.BUCKET_NAME;

    const storage = new Storage({
      projectId: process.env.PROJECT_ID,
      keyFilename: process.env.KEY_FILE_NAME,
    }).bucket(bucket);

    const url = await new Promise((resolve, reject) => {
      image
        .createReadStream()
        .pipe(storage.file(image.filename).createWriteStream())
        .on("finish", async () => {
          resolve(`https://storage.googleapis.com/${bucket}/${image.filename}`);
        })
        .on("error", (error) => {
          reject(`Unable to upload image`);
          return error;
        });
    });

    const result = await this.boardImageRepository.save({
      url: url.toString(),
    });
    return result;
  }

  async findOne({ boardImageId }) {
    await this.boardImageRepository.findOne({
      where: { id: boardImageId },
    });
  }

  async findAll() {
    await this.boardImageRepository.find({});
  }

  async update({ boardImageId, image }) {
    await this.boardImageRepository.softDelete({ id: boardImageId });

    const bucket = process.env.BUCKET_NAME;

    const storage = new Storage({
      projectId: process.env.PROJECT_ID,
      keyFilename: process.env.KEY_FILE_NAME,
    }).bucket(bucket);

    const url = await new Promise((resolve, reject) => {
      image
        .createReadStream()
        .pipe(storage.file(image.filename).createWriteStream())
        .on("finish", async () => {
          resolve(`https://storage.googleapis.com/${bucket}/${image.filename}`);
        })
        .on("error", (error) => {
          reject(`Unable to upload image`);
          return error;
        });
    });

    const result = await this.boardImageRepository.save({
      url: url.toString(),
    });
    return result;
  }

  async delete({ boardImageId }) {
    const result = await this.boardImageRepository.softDelete({
      id: boardImageId,
    });
    return result.affected ? true : false;
  }
}
