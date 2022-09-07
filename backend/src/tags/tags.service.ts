import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TagImage } from "src/tag-images/entities/tag-image.entity";
import { Repository } from "typeorm";
import { Tag } from "./entities/tag.entity";

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,

    @InjectRepository(TagImage)
    private TagImageRepository: Repository<TagImage>
  ) {}

  async create(createTagInput) {
    const { name, ...tag } = createTagInput;

    const checkTag = this.tagsRepository.findOne({
      where: { name },
    });

    // 같은 이름의 태그가 존재한다면 에러를 던진다.
    if (checkTag) {
      throw new Error("이미 존재하는 태그입니다.");
    }
    return this.tagsRepository.save({
      name,
      ...tag,
    });
  }

  findAll() {
    return this.tagsRepository.find({ relations: ["users", "boards"] });
  }

  findOne(id: string) {
    return this.tagsRepository.findOne({
      where: { id },
      relations: ["users", "boards"],
    });
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
