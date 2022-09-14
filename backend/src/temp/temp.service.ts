import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "src/categories/entities/category.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { Repository } from "typeorm";

@Injectable()
export class TempService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  async temp({ tagName, categoryName }) {
    // tagName 배열을 받아서 태그를 생성한다.
    const tags = await Promise.all(
      tagName.map(async (name) => {
        const tag = await this.tagRepository.findOne({ where: { name } });
        if (tag) return tag;
        return this.tagRepository.save({ name });
      })
    );

    // categoryName을 받아서 카테고리를 생성한다.
    const category = await this.categoryRepository.save({ name: categoryName });

    // 태그와 카테고리를 연결한다.
    await Promise.all(
      tags.map(async (tag) => {
        await this.tagRepository.save({
          ...tag,
          category: { id: category.id },
        });
      })
    );

    return true;
  }

  async delete() {
    await this.categoryRepository.query(`
      DELETE FROM user_categories_category;
      DELETE FROM board_tags_tag;
      DELETE FROM user_tags_tag;
      DELETE FROM board_categories_category;
      DELETE FROM tags;
      DELETE FROM categories;
    `);
  }
}
