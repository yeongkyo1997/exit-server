import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserImage } from "./entities/user-image.entity";
import { FilesService } from "src/files/files.service";
import { User } from "src/users/entities/user.entity";

@Injectable()
export class UserImagesService {
  constructor(
    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

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

  async delete({ userImageId, userId }) {
    // 값이 비면 TypeORM이 where 조건을 빼 버려 엉뚱한 행이 잡히므로 먼저 막는다
    if (!userImageId || !userId)
      throw new ForbiddenException("본인 프로필 이미지만 삭제할 수 있습니다.");

    // 요청자 본인의 프로필 이미지인지 확인한다
    const owner = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userImage"],
    });
    if (!owner?.userImage || owner.userImage.id !== userImageId)
      throw new ForbiddenException("본인 프로필 이미지만 삭제할 수 있습니다.");

    const userImage = await this.userImageRepository.findOne({
      where: { id: userImageId },
    });
    if (!userImage) {
      throw new UnprocessableEntityException("존재하지 않는 이미지입니다.");
    }
    const result = await this.userImageRepository.softDelete({
      id: userImageId,
    });
    return !!result.affected;
  }
}
