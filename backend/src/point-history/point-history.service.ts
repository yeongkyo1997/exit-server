import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PointHistory } from "./entities/point-history.entity";

@Injectable()
export class PointHistoryService {
  constructor(
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>
  ) {}

  async findAll({ userId }) {
    return await this.pointHistoryRepository.find({
      where: { user: { id: userId } },
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: 5,
      skip: 0,
    });
  }

  // findOne(id: string) {
  //   return `This action returns a #${id} pointHistory`;
  // }

  async create({ userId, createPointHistoryInput }) {
    return await this.pointHistoryRepository.save({
      ...createPointHistoryInput,
      user: userId,
    });
  }

  async update({ updatePointHistoryInput, pointHistoryId }) {
    return await this.pointHistoryRepository.save({
      id: pointHistoryId,
      ...updatePointHistoryInput,
    });
  }

  async remove({ pointHistoryId }) {
    const result = await this.pointHistoryRepository.delete({
      id: pointHistoryId,
    });
    return result.affected ? true : false;
  }
}
