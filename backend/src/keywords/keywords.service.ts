import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Keyword } from "./entities/keyword.entity";

@Injectable()
export class KeywordsService {
  constructor(
    @InjectRepository(Keyword)
    private keywordsRepository: Repository<Keyword>
  ) {}

  findAll() {
    return this.keywordsRepository.find({ relations: ["boards", "users"] });
  }

  findOne(id: string) {
    return this.keywordsRepository.findOne({
      where: { id },
      relations: ["boards", "users"],
    });
  }

  create(createKeywordInput) {
    const checkKeyword = this.keywordsRepository.findOne({
      where: { name: createKeywordInput.name },
    });

    // 같은 이름의 키워드가 존재한다면 에러를 던진다.
    if (checkKeyword) {
      throw new Error("이미 존재하는 키워드입니다.");
    }

    return this.keywordsRepository.save(createKeywordInput);
  }

  async update(id: string, updateKeywordInput) {
    const keyword = await this.keywordsRepository.findOne({ where: { id } });
    // 키워드가 존재하지 않는다면 에러를 던진다.
    if (!keyword) {
      throw new Error("존재하지 않는 키워드입니다.");
    }
    const checkKeyword = await this.keywordsRepository.findOne({
      where: { name: updateKeywordInput.name },
    });

    // 같은 이름의 키워드가 존재한다면 에러를 던진다.
    if (checkKeyword) {
      throw new Error("이미 존재하는 키워드입니다.");
    }

    return this.keywordsRepository.save({ ...keyword, ...updateKeywordInput });
  }

  remove(id: string) {
    const keyword = this.keywordsRepository.findOne({ where: { id } });
    // 키워드가 존재하지 않는다면 에러를 던진다.
    if (!keyword) {
      throw new Error("존재하지 않는 키워드입니다.");
    }
    return this.keywordsRepository.softDelete({ id });
  }
}
