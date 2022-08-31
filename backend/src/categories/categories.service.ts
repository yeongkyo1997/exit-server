import { Injectable } from "@nestjs/common";
import { CreateCategoryInput } from "./dto/create-category.input";
import { UpdateCategoryInput } from "./dto/update-category.input";

@Injectable()
export class CategoriesService {
  create(createCategoryInput: CreateCategoryInput) {
    return "This action adds a new category";
  }

  findAll() {
    return `This action returns all categories`;
  }

  findOne(id: string) {
    return `This action returns a #${id} category`;
  }

  update(id: string, updateCategoryInput: UpdateCategoryInput) {
    return `This action updates a #${id} category`;
  }

  remove(id: string) {
    return `This action removes a #${id} category`;
  }
}
