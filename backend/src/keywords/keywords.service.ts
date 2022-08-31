import { Injectable } from "@nestjs/common";
import { CreateKeywordInput } from "./dto/create-keyword.input";
import { UpdateKeywordInput } from "./dto/update-keyword.input";

@Injectable()
export class KeywordsService {
  create(createKeywordInput: CreateKeywordInput) {
    return "This action adds a new keyword";
  }

  findAll() {
    return `This action returns all keywords`;
  }

  findOne(id: string) {
    return `This action returns a #${id} keyword`;
  }

  update(id: string, updateKeywordInput: UpdateKeywordInput) {
    return `This action updates a #${id} keyword`;
  }

  remove(id: string) {
    return `This action removes a #${id} keyword`;
  }
}
