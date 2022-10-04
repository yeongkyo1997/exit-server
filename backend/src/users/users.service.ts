import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { DataSource, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { Category } from "src/categories/entities/category.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { Board } from "src/boards/entities/board.entity";

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

    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    private readonly dataSource: DataSource
  ) {}

  async create({ password, createUserInput }) {
    const { email, nickname, userImage, ...rest } = createUserInput;

    const findEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (findEmail) throw new ConflictException("이미 존재하는 이메일입니다.");

    const findNickname = await this.userRepository.findOne({
      where: { nickname },
    });

    if (findNickname)
      throw new ConflictException("이미 존재하는 닉네임입니다.");

    const saveImage = await this.userImageRepository.save({
      ...userImage,
    });

    const saveUser = await this.userRepository.save({
      ...createUserInput,
      userImage: saveImage,
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

  async findOneByNickname({ nickname }) {
    const findUser = await this.userRepository.findOne({
      where: { nickname },
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

    const today = new Date(new Intl.DateTimeFormat("kr").format());
    const start = userboard.board.startAt;
    const end = userboard.board.endAt;

    if (today > start && today < end) {
      const result = await this.boardRepository.findOne({
        where: {
          id: userboard.board.id,
        },
        relations: ["boardImage", "tags", "keywords", "categories"],
      });
      return result;
    }
  }

  async findBoards({ userId }) {
    const userboards = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        isAccepted: true,
      },
      relations: ["board"],
    });

    const today = new Date(new Intl.DateTimeFormat("kr").format());
    const result = [];
    await Promise.all(
      userboards.map(async (el) => {
        if (!(el["board"].startAt < today && el["board"].endAt > today)) {
          result.push(
            await this.boardRepository.findOne({
              where: {
                id: el.board.id,
              },
              relations: ["boardImage", "tags", "keywords", "categories"],
            })
          );
        }
      })
    );
    return result;
  }

  async update({ userId, updateUserInput }) {
    const originUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["tags", "keywords", "categories", "userImage"],
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

    // 유저와 태그의 중간 테이블에 있는 데이터를 삭제
    await this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from("user_tags_tag")
      .where("userId = :userId", {
        userId: userId,
      })
      .execute();

    // 유저와 키워드의 중간 테이블에 있는 데이터를 삭제
    await this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from("user_keywords_keyword")
      .where("userId = :userId", {
        userId: userId,
      })
      .execute();

    // 유저와 카테고리의 중간 테이블에 있는 데이터를 삭제
    await this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from("user_categories_category")
      .where("userId = :userId", {
        userId: userId,
      })
      .execute();

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

    const updatedUser = await this.userRepository.save({
      ...originUser,
      ...updateUser,
      tags: saveTags,
      keywords: saveKeywords,
      categories: saveCategories,
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

  async checkEmailDuplicate({ email }) {
    const findUser = await this.userRepository.findOne({
      where: { email },
    });
    // 중복된 이메일이 있으면 에러
    if (findUser) throw new ConflictException("이미 존재하는 이메일입니다.");
    return findUser ? true : false;
  }

  async updatePassword({ email, password }) {
    const findUser = await this.userRepository.findOne({ where: { email } });

    const hashedPassword = await bcrypt.hash(password, 10.2);

    const updateUser = await this.userRepository.save({
      ...findUser,
      password: hashedPassword,
    });
    return updateUser;
  }

  async fetchUserRandom() {
    const findUser = await this.userRepository.find({
      relations: ["userImage", "tags", "keywords", "categories"],
    });
    const result = findUser.filter((user) => user["userImage"].url !== "null");

    const randomUser = result[Math.floor(Math.random() * result.length)];

    return randomUser;
  }
}
