import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateCategoryInput } from "./dto/create-category.input";
import { UpdateCategoryInput } from "./dto/update-category.input";
import { Category } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  findAll() {
    return this.categoryRepository.find({ relations: ["boards"] });
  }

  findOne(id: string) {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ["boards"],
    });
  }

  async create(createCategoryInput: CreateCategoryInput) {
    const checkCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryInput.name },
    });

    // 같은 이름의 카테고리가 존재하면 에러를 던진다.
    if (checkCategory) {
      throw new Error("이미 존재하는 카테고리입니다.");
    }

    const newCategory = this.categoryRepository.create(createCategoryInput);
    return this.categoryRepository.save(newCategory);
  }

  async update(id: string, updateCategoryInput: UpdateCategoryInput) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    // 카테고리가 존재하지 않는다면 에러를 던진다.
    if (!category) {
      throw new Error("존재하지 않는 카테고리입니다.");
    }
    const checkCategory = await this.categoryRepository.findOne({
      where: { name: updateCategoryInput.name },
    });

    // 같은 이름의 카테고리가 존재한다면 에러를 던진다.
    if (checkCategory) {
      throw new Error("이미 존재하는 카테고리입니다.");
    }

    return this.categoryRepository.save({
      ...category,
      ...updateCategoryInput,
    });
  }

  async remove(id: string) {
    // 카테고리가 존재하지 않는다면 에러를 던진다.
    if (!(await this.categoryRepository.findOne({ where: { id } }))) {
      throw new Error("존재하지 않는 카테고리입니다.");
    }
    return this.categoryRepository.softDelete({ id });
  }

  async restore(id: string) {
    // 카테고리가 존재하지 않는다면 에러를 던진다.
    if (!(await this.categoryRepository.findOne({ where: { id } }))) {
      throw new Error("존재하지 않는 카테고리입니다.");
    }
    return this.categoryRepository.restore({ id });
  }
}
