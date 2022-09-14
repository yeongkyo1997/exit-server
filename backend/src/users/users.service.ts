import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { Category } from "src/categories/entities/category.entity";
import { EmailService } from "src/email/email.service";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";

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
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(UserBoard)
    private readonly userBoardRepository: Repository<UserBoard>,

    private readonly emailService: EmailService
  ) {}

  async create({ password, createUserInput }) {
    const email = createUserInput.email;
    const nickname = createUserInput.nickname;

    const findEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (findEmail) throw new ConflictException("이미 존재하는 이메일입니다.");

    const findNickname = await this.userRepository.findOne({
      where: { nickname },
    });

    if (findNickname)
      throw new ConflictException("이미 존재하는 닉네임입니다.");

    const saveUser = await this.userRepository.save({
      ...createUserInput,
      password,
    });

    return saveUser;
  }

  async findAll({ page }) {
    const findUsers = await this.userRepository.find({
      relations: ["userImage", "tags", "keywords", "categories"],
      order: { createdAt: "DESC" },
      take: 10,
      skip: (page - 1) * 10 || 0,
    });
    return findUsers;
  }

  async findOne({ userId }) {
    const findUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userImage", "tags", "keywords", "categories"],
    });

    return findUser;
  }

  async findOneByEmail({ email }) {
    const findUser = await this.userRepository.findOne({
      where: { email },
      relations: ["userImage", "tags", "keywords", "categories"],
    });
    return findUser;
  }

  async findOneByUserId({ userId }) {
    const findUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userImage", "tags", "keywords", "categories"],
    });
    return findUser;
  }

  async findBoard({ userId }) {
    const userboard = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        isAccepted: Boolean(1),
      },
      relations: ["board"],
    });

    const today = new Date();
    const start = userboard.board.startAt;
    const end = userboard.board.endAt;

    if (today > start && today < end) {
      return userboard.board;
    }
  }

  async update({ userId, updateUserInput }) {
    const originUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tags", "keywords", "categories"],
    });

    if (!originUser) {
      throw new NotFoundException("존재하지 않는 유저입니다");
    }

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

    const updatedUser = await this.userRepository.save({
      ...originUser,
      ...updateUser,
      userImage: userImage,
      tags: originTags,
      keywords: originKeywords,
      categories: originCategories,
    });
    return updatedUser;
  }

  async remove({ userId }) {
    const isValid = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!isValid) throw new NotFoundException("존재하지 않는 유저입니다.");

    const deleteUser = await this.userRepository.softDelete({ id: userId });
    return deleteUser.affected ? true : false;
  }

  async restore({ userId }) {
    const isValid = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!isValid) throw new NotFoundException("존재하지 않는 이메일입니다.");

    const restoreUser = await this.userRepository.restore({ id: userId });
    return restoreUser.affected ? true : false;
  }

  async changePassword({ email, password }) {
    const findUser = await this.userRepository.findOne({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUser = await this.userRepository.save({
      ...findUser,
      password: hashedPassword,
    });
    return updateUser;
  }

  async checkDuplicateEmail({ email }) {
    const findUser = await this.userRepository.findOne({ where: { email } });
    // 중복된 이메일이 있으면 에러
    if (findUser) throw new ConflictException("이미 존재하는 이메일입니다.");
    return findUser ? true : false;
  }

  async isRegisteredEmail({ email, emailToken }) {
    const findUser = await this.userRepository.findOne({ where: { email } });
    if (!findUser)
      throw new UnauthorizedException("가입되지 않은 이메일입니다.");

    await this.emailService.checkEmail({ email, emailToken });
  }

  async updatePassword({ email, password }) {
    const findUser = await this.userRepository.findOne({ where: { email } });

    const updateUser = await this.userRepository.save({
      ...findUser,
      password,
    });
    return updateUser;
  }

  async fetchUserRandom() {
    const findUser = await this.userRepository.find({
      relations: ["userImage", "tags", "keywords", "categories"],
    });
    const randomUser = findUser[Math.floor(Math.random() * findUser.length)];
    return randomUser;
  }
}
