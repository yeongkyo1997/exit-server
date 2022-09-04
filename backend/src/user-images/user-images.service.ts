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

  async create({ images }) {
    const waitedImages = await Promise.all(images);

    const bucket = process.env.BUCKET_NAME;

    const storage = new Storage({
      projectId: process.env.PROJECT_ID,
      keyFilename: process.env.KEY_FILE_NAME,
    }).bucket(bucket);

    const results = [];
    await Promise.all(
      waitedImages.map(async (el) => {
        const url = await new Promise((resolve, reject) => {
          el.createReadStream()
            .pipe(storage.file(el.filename).createWriteStream())
            .on("finish", async () => {
              resolve(
                `https://storage.googleapis.com/${bucket}/${el.filename}`
              );
            })
            .on("error", (error) => {
              reject(`Unable to upload image`);
              return error;
            });
        });
        const result = await this.userImageRepository.save({
          url: url.toString(),
        });
        await results.push(result);
      })
    );
    console.log("results=", results);
    return results;
  }

  async findOne({ image }) {
    //
  }

  async findAll({ images }) {
    //
  }

  async update({ images }) {
    //
  }

  async delete({ images }) {
    //
  }
}
