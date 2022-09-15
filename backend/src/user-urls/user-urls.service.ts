import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserUrl } from "./entities/user-url.entity";

@Injectable()
export class UserUrlsService {
  constructor(
    @InjectRepository(UserUrl)
    private readonly userUrlRepository: Repository<UserUrl>
  ) {}

  async findAll({ userId }) {
    return await this.userUrlRepository.find({
      where: { user: { id: userId } },
    });
  }

  // findOne(id: string) {
  //   return `This action returns a #${id} userUrl`;
  // }

  async create({ userId, userUrl }) {
    const isValid = await this.userUrlRepository.findOne({
      where: { url: userUrl },
    });

    if (isValid) throw Error("이미 등록된 Url입니다.");

    return await this.userUrlRepository.save({
      url: userUrl,
      user: userId,
    });
  }

  async update({ userUrl, userUrlId }) {
    return await this.userUrlRepository.save({
      id: userUrlId,
      url: userUrl,
    });
  }

  async remove({ userUrlId }) {
    const result = await this.userUrlRepository.delete({
      id: userUrlId,
    });
    return result.affected ? true : false;
  }
}
