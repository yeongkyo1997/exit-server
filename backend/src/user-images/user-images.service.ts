import {
  ConsoleLogger,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { CreateUserImageInput } from "./dto/create-user-image.input";
import { UpdateUserImageInput } from "./dto/update-user-image.input";
import { Storage } from "@google-cloud/storage";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { Board } from "src/boards/entities/board.entity";
import { UserImage } from "./entities/user-image.entity";

@Injectable()
export class UserImagesService {
  constructor(
    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>
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

    const result = await this.userImageRepository.save({ url: url.toString() });
    return result;
  }

  async findOne({ userImageId }) {
    await this.userImageRepository.findOne({
      where: { id: userImageId },
    });
  }

  async findAll() {
    await this.userImageRepository.find({});
  }

  async update({ userImageId, image }) {
    await this.userImageRepository.softDelete({ id: userImageId });

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

    const result = await this.userImageRepository.save({ url: url.toString() });
    return result;
  }

  async delete({ userImageId }) {
    const result = await this.userImageRepository.softDelete({
      id: userImageId,
    });
    return result.affected ? true : false;
  }
}
