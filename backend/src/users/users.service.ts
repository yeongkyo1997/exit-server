import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserImage } from "src/user-images/entities/user-image.entity";
import { Repository } from "typeorm";
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

    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    @InjectRepository(Keyword)
    private readonly keywordRepository: Repository<Keyword>
  ) {}
  async create({ password, createUserInput }) {
    const { email, userImage, tags, boards, keywords, ...rest } =
      createUserInput;
    const findUser = await this.userRepository.findOne({ where: { email } });

    if (findUser) throw new ConflictException("이미 등록된 이메일입니다.");
    const saveImage = await this.userImageRepository.save({ ...userImage });

    const saveTags = [];
    for (let i = 0; i < tags.length; i++) {
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

    const saveBoards = [];
    for (let j = 0; j < boards.length; j++) {
      const board = boards[j];
      saveBoards.push(board);
    }

    const saveKeywords = [];
    for (let k = 0; k < keywords.length; k++) {
      const keyword = keywords[k];
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
      password,
      email,
      ...rest,
      userImage: saveImage,
      tags: saveTags,
      boards: saveBoards,
      keywords: saveKeywords,
    });

    return saveUser;
  }

  async findAll() {
    const findUsers = await this.userRepository.find({
      relations: ["userImage, tags, boards, keywords"],
    });
    return findUsers;
  }

  async findOne({ userId }) {
    const findUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userImage, tags, boards, keywords"],
    });
    return findUser;
  }

  async update({ userId, updateUserInput }) {
    const findUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    const updateUser = this.userRepository.save({
      ...findUser,
      id: userId,
      ...updateUserInput,
    });
    return updateUser;
  }

  async remove({ userId }) {
    const removeUser = await this.userRepository.softDelete({ id: userId });
    return removeUser.affected ? true : false;
  }
}
