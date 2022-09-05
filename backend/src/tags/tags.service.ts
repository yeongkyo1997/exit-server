import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateTagInput } from "./dto/update-tag.input";
import { Tag } from "./entities/tag.entity";

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>
  ) {}

  create(createTagInput) {
    const checkTag = this.tagsRepository.findOne({
      where: { name: createTagInput.name },
    });

    // 같은 이름의 태그가 존재한다면 에러를 던진다.
    if (checkTag) {
      throw new Error("이미 존재하는 태그입니다.");
    }
    return this.tagsRepository.save(createTagInput);
  }

  findAll() {
    return this.tagsRepository.find();
  }

  findOne(id: string) {
    return this.tagsRepository.findOne({ where: { id } });
  }

  update(id: string, updateTagInput) {
    const tag = this.tagsRepository.findOne({ where: { id } });
    // 태그가 존재하지 않는다면 에러를 던진다.
    if (!tag) {
      throw new Error("존재하지 않는 태그입니다.");
    }
    const checkTag = this.tagsRepository.findOne({
      where: { name: updateTagInput.name },
    });

    // 같은 이름의 태그가 존재한다면 에러를 던진다.
    if (checkTag) {
      throw new Error("이미 존재하는 태그입니다.");
    }

    return this.tagsRepository.save({ ...tag, ...updateTagInput });
  }

  remove(id: string) {
    const tag = this.tagsRepository.findOne({ where: { id } });
    // 태그가 존재하지 않는다면 에러를 던진다.
    if (!tag) {
      throw new Error("존재하지 않는 태그입니다.");
    }
    return this.tagsRepository.softDelete({ id });
  }

  /**
   * 태그를 복구한다.
   * @param id 태그의 id
   * @returns 복구된 태그
   */
  restore(id: string) {
    const tag = this.tagsRepository.findOne({ where: { id } });
    // 태그가 존재하지 않는다면 에러를 던진다.
    if (!tag) {
      throw new Error("존재하지 않는 태그입니다.");
    }
    return this.tagsRepository.restore({ id });
  }
}
