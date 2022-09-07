import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { Category } from "src/categories/entities/category.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,

    @InjectRepository(Keyword)
    private readonly keywordRepository: Repository<Keyword>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  async create({ password, createUserInput }) {
    const { email, nickname, ...user } = createUserInput;

    const findUser = await this.userRepository.findOne({ where: { email } });
    if (findUser) throw new ConflictException("이미 존재하는 이메일입니다.");

    const findNickname = await this.userRepository.findOne({
      where: { nickname },
    });
    if (findNickname)
      throw new ConflictException("이미 존재하는 닉네임입니다.");

    const savedInfo = await this.userRepository.save({
      ...user,
      email,
      nickname,
      password,
    });

    return savedInfo;
  }

  async findAll() {
    const findUsers = await this.userRepository.find({
      relations: ["userImage", "tags", "keywords", "categories"],
    });
    return findUsers;
  }

  async findOneWithEmail({ email }) {
    const findUser = await this.userRepository.findOne({
      where: { email },
      relations: ["userImage", "tags", "keywords", "categories"],
    });
    return findUser;
  }

  async findOneWithUserId({ userId }) {
    const findUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userImage", "tags", "keywords", "categories"],
    });
    return findUser;
  }

  // 로그인한 유저 수정
  async update({ email, updateUserInput }) {
    const originUser = await this.userRepository.findOne({
      where: { email },
      relations: ["tags", "keywords", "categories"],
    });

    const {
      tags: originTags,
      keywords: originKeywords,
      categories: originCategories,
    } = originUser;

    const { userImage, tags, keywords, categories, ...updateUser } =
      updateUserInput;

    if (userImage) {
      await this.userImageRepository.update(
        {
          id: originUser.userImage.id,
        },
        {
          url: userImage.url,
        }
      );
    }

    const saveTags = [];
    for (let i = 0; tags && i < tags.length; i++) {
      const tag = tags[i];
      const findTag = await this.tagRepository.findOne({
        where: { name: tag },
      });

      if (findTag) {
        saveTags.push(findTag);
      } else {
        const newTag = await this.tagRepository.save({
          name: tag,
        });
        saveTags.push(newTag);
      }
    }

    const saveKeywords = [];
    for (let i = 0; keywords && i < keywords.length; i++) {
      const keyword = keywords[i];
      const findKeyword = await this.keywordRepository.findOne({
        where: { name: keyword },
      });
      if (findKeyword) {
        saveKeywords.push(findKeyword);
      } else {
        const newKeyword = await this.keywordRepository.save({
          name: keyword,
        });
        saveKeywords.push(newKeyword);
      }
    }

    const saveCategories = [];
    for (let i = 0; categories && i < categories.length; i++) {
      const category = categories[i];
      const findCategory = await this.categoryRepository.findOne({
        where: { name: category },
      });
      if (findCategory) {
        saveCategories.push(findCategory);
      } else {
        const newCategory = await this.categoryRepository.save({
          name: category,
        });
        saveCategories.push(newCategory);
      }
    }

    originTags.push(...saveTags);
    originKeywords.push(...saveKeywords);
    originCategories.push(...saveCategories);

    const updatedUser = this.userRepository.save({
      ...originUser,
      ...updateUser,
      userImage: userImage,
      tags: originTags,
      keywords: originKeywords,
      categories: originCategories,
    });
    return updatedUser;
  }

  // 로그인한 유저 삭제
  async remove({ email }) {
    const isValid = await this.userRepository.findOne({ where: { email } });

    if (!isValid) throw new ConflictException("존재하지 않는 이메일입니다.");

    const deleteUser = await this.userRepository.softDelete({ email });
    return deleteUser.affected ? true : false;
  }

  // 비밀번호 변경
  async changePassword({ email, password }) {
    const findUser = await this.userRepository.findOne({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUser = await this.userRepository.save({
      ...findUser,
      password: hashedPassword,
    });
    return updateUser;
  }

  // 삭제된 유저 복구
  async restore({ email }) {
    const isValid = await this.userRepository.findOne({ where: { email } });

    if (!isValid) throw new ConflictException("존재하지 않는 이메일입니다.");

    const restoreUser = await this.userRepository.restore({ email });
    return restoreUser.affected ? true : false;
  }

  // 유저 중복확인
  async checkDuplicateEmail({ email }) {
    const findUser = await this.userRepository.findOne({ where: { email } });
    return findUser ? true : false;
  }
}
