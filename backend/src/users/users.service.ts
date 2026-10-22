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
import { User } from "./entities/user.entity";
import { Category } from "src/categories/entities/category.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { BOARD_RELATIONS, USER_RELATIONS } from "src/commons/relations";
import { toLocalDate } from "src/commons/utils/date";
import { hashPassword } from "src/commons/utils/password";
import {
  deleteJoinRows,
  findOrCreateByName,
} from "src/commons/utils/repository";

// userBoard를 조회하면서 board와 board의 관계까지 함께 불러온다
const USER_BOARD_RELATIONS = [
  "board",
  ...BOARD_RELATIONS.map((relation) => `board.${relation}`),
];

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

    private readonly dataSource: DataSource
  ) {}

  async create({ password, createUserInput }) {
    const { email, nickname, userImage } = createUserInput;

    await this.checkEmailDuplicate({ email });

    const findNickname = await this.userRepository.findOne({
      where: { nickname },
    });

    if (findNickname)
      throw new ConflictException("이미 존재하는 닉네임입니다.");

    const saveImage = await this.userImageRepository.save({
      ...userImage,
    });

    return this.userRepository.save({
      ...createUserInput,
      userImage: saveImage,
      password,
    });
  }

  async findAll({ page }) {
    return this.userRepository.find({
      relations: USER_RELATIONS,
      order: { createdAt: "DESC" },
      take: 10,
      skip: (page - 1) * 10 || 0,
    });
  }

  async findOneByUserId({ userId }) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: USER_RELATIONS,
    });
  }

  async findOneByEmail({ email }) {
    // email이 없으면 where 조건이 빠져 첫 번째 유저가 조회되므로 바로 null을 반환
    if (!email) return null;

    return this.userRepository.findOne({
      where: { email },
      relations: USER_RELATIONS,
    });
  }

  // 로그인용: 관계 없이 유저 행만 조회한다
  async findOneByEmailForAuth({ email }) {
    // email이 없으면 where 조건이 빠져 첫 번째 유저가 조회되므로 바로 null을 반환
    if (!email) return null;

    return this.userRepository.findOne({ where: { email } });
  }

  async findOneByNickname({ nickname }) {
    return this.userRepository.findOne({
      where: { nickname },
      relations: USER_RELATIONS,
    });
  }

  async findBoard({ userId }) {
    const userboard = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        isAccepted: true,
      },
      relations: USER_BOARD_RELATIONS,
    });

    const today = toLocalDate();
    const start = userboard.board.startAt;
    const end = userboard.board.endAt;

    if (today > start && today < end) {
      return userboard.board;
    }
  }

  async findBoards({ userId }) {
    const userboards = await this.userBoardRepository.find({
      where: {
        user: { id: userId },
        isAccepted: true,
      },
      relations: USER_BOARD_RELATIONS,
    });

    const today = toLocalDate();
    return userboards
      .filter((el) => !(el.board.startAt < today && el.board.endAt > today))
      .map((el) => el.board);
  }

  async update({ userId, updateUserInput }) {
    const originUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userImage"],
    });
    if (!originUser) {
      throw new NotFoundException("존재하지 않는 유저입니다");
    }

    const { userImage, tags, keywords, categories, ...updateUser } =
      updateUserInput;

    // 닉네임은 채팅 상대·출석·프로필 조회의 식별자로 쓰이므로 다른 유저와 겹치면 안 된다 (create와 같은 검사).
    // 바뀔 때만 확인한다: 이미 다른 유저와 겹쳐 있던 기존 닉네임을 그대로 보내는 프로필 수정은 막지 않는다
    if (
      typeof updateUser.nickname === "string" &&
      updateUser.nickname !== originUser.nickname
    ) {
      const findNickname = await this.userRepository.findOne({
        where: { nickname: updateUser.nickname },
      });
      if (findNickname && findNickname.id !== userId)
        throw new ConflictException("이미 존재하는 닉네임입니다.");
    }

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

    // 유저와 태그·키워드·카테고리의 중간 테이블에 있는 데이터를 삭제
    await deleteJoinRows(
      this.dataSource.manager,
      ["user_tags_tag", "user_keywords_keyword", "user_categories_category"],
      "userId",
      userId
    );

    const saveTags = await findOrCreateByName(this.tagRepository, tags);
    const saveKeywords = await findOrCreateByName(
      this.keywordRepository,
      keywords
    );
    const saveCategories = await findOrCreateByName(
      this.categoryRepository,
      categories
    );

    // point와 password는 저장하지 않는다. 처음에 읽은 값을 그대로 쓰면 그사이 결제로 충전된 포인트나
    // 바뀐 비밀번호를 옛 값으로 되돌린다 (save는 undefined인 컬럼을 건드리지 않는다)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { point, password, ...userWithoutSecrets } = originUser;
    const savedUser = await this.userRepository.save({
      ...userWithoutSecrets,
      ...updateUser,
      tags: saveTags,
      keywords: saveKeywords,
      categories: saveCategories,
    });

    // 응답의 point(Int!)는 저장한 뒤 새로 읽은 값으로 채운다
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, point: true },
    });
    return { ...savedUser, point: currentUser ? currentUser.point : point };
  }

  async remove({ userId }) {
    const isValid = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!isValid) throw new NotFoundException("존재하지 않는 유저입니다.");

    const deleteUser = await this.userRepository.softDelete({ id: userId });
    return !!deleteUser.affected;
  }

  async restore({ userId }) {
    const isValid = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!isValid) throw new NotFoundException("존재하지 않는 이메일입니다.");

    const restoreUser = await this.userRepository.restore({ id: userId });
    return !!restoreUser.affected;
  }

  async checkEmailDuplicate({ email }) {
    const findUser = await this.userRepository.findOne({
      where: { email },
    });
    // 중복된 이메일이 있으면 에러
    if (findUser) throw new ConflictException("이미 존재하는 이메일입니다.");
    return false;
  }

  // 평문 비밀번호를 받아 여기서 한 번만 해싱한다 (호출하는 쪽에서 해싱하지 않는다)
  async updatePassword({ email, password }) {
    // email이 없으면 null을 반환하는 조회를 써서 where가 빠진 '첫 유저' 조회를 막는다
    const findUser = await this.findOneByEmailForAuth({ email });
    if (!findUser) throw new NotFoundException("존재하지 않는 유저입니다.");

    const hashedPassword = await hashPassword(password);

    // 비밀번호 컬럼만 바꾼다 (해싱하는 동안 결제로 충전된 point를 읽어 둔 옛 값으로 덮어쓰지 않게)
    await this.userRepository.update(
      { id: findUser.id },
      { password: hashedPassword }
    );
    return { ...findUser, password: hashedPassword };
  }

  async fetchUserRandom() {
    // 프로필 이미지 필터에 필요한 id와 userImage만 불러오고, 고른 한 명만 관계까지 다시 조회한다
    const users = await this.userRepository.find({
      select: { id: true },
      relations: ["userImage"],
    });
    const result = users.filter((user) => user.userImage.url !== "null");

    const randomUser = result[Math.floor(Math.random() * result.length)];
    // 후보가 없을 때 id 없이 조회하면 첫 번째 유저가 나오므로 바로 반환
    if (!randomUser) return undefined;

    return this.userRepository.findOne({
      where: { id: randomUser.id },
      relations: USER_RELATIONS,
    });
  }
}
