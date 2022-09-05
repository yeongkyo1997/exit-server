import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";

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
    private readonly keywordRepository: Repository<Keyword>
  ) {}

  async create({ password, createUserInput }) {
    const { email, userImage, tags, keywords, ...rest } = createUserInput;
    const saveImage = await this.userImageRepository.save({ ...userImage });

    const findUser = await this.userRepository.findOne({ where: { email } });
    if (findUser) throw new ConflictException("이미 존재하는 이메일입니다.");

    const saveTags = [];
    for (let i = 0; i < tags.length && !tags; i++) {
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
    for (let i = 0; i < keywords.length && !keywords; i++) {
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
    console.log(saveKeywords);
    const saveUser = await this.userRepository.save({
      ...rest,
      email,
      password,
      userImage: saveImage,
      tags: saveTags,
      keywords: saveKeywords,
    });

    return saveUser;
  }

  async findAll() {
    const findUsers = await this.userRepository.find({
      relations: ["userImage", "tags", "keywords"],
    });
    return findUsers;
  }

  async findOneWithEmail({ email }) {
    const findUser = await this.userRepository.findOne({
      where: { email },
      relations: ["userImage", "tags", "keywords"],
    });
    return findUser;
  }

  async findOneWithUserId({ userId }) {
    const findUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userImage", "tags", "keywords"],
    });
    return findUser;
  }

  // 로그인한 유저 수정
  async update({ email, updateUserInput }) {
    const findUser = await this.userRepository.findOne({
      where: { email },
    });
    const updateUser = this.userRepository.save({
      ...findUser,
      email,
      ...updateUserInput,
    });
    return updateUser;
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
