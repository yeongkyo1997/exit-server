import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BoardImage } from "src/board-images/entities/board-image.entity";
import { Category } from "src/categories/entities/category.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { Repository } from "typeorm";
import { Board } from "./entities/board.entity";

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Keyword)
    private readonly keywordRepository: Repository<Keyword>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(UserBoard)
    private readonly userBoardRepository: Repository<UserBoard>,
    @InjectRepository(BoardImage)
    private readonly boardImageRepository: Repository<BoardImage>
  ) {}

  findAll({ isSuccess, status, page, tagName, categoryName, keywordName }) {
    return this.boardRepository.find({
      where: {
        isSuccess,
        status,
        tags: { name: tagName },
        categories: { name: categoryName },
        keywords: { name: keywordName },
      },
      relations: ["boardImage", "tags", "keywords", "categories"],
      take: 10,
      skip: page || 0,
    });
  }

  findAllByLikes({
    isSuccess,
    status,
    page,
    tagName,
    categoryName,
    keywordName,
  }) {
    return this.boardRepository.find({
      where: {
        isSuccess,
        status,
        tags: { name: tagName },
        categories: { name: categoryName },
        keywords: { name: keywordName },
      },
      order: { countLike: "DESC" },
      relations: ["boardImage", "tags", "keywords", "categories"],
      take: 10,
      skip: page || 0,
    });
  }

  findOne({ boardId }) {
    return this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage", "tags", "keywords", "categories"],
    });
  }

  findOneByCategory({ categoryName }) {
    return this.boardRepository.createQueryBuilder("board");
  }

  async create({ leader, createBoardInput }) {
    const { boardImage, tags, keywords, categories, ...board } =
      createBoardInput;

    // 썸네일 저장 후 이미지DB에 저장하는 로직
    const boardImageResult = await this.boardImageRepository.save({
      url: boardImage.url,
    });

    // 다대다 확인 후 등록 로직
    const tagsResult = [];
    for (let i = 0; tags && i < tags.length; i++) {
      const prevTag = await this.tagRepository.findOne({
        where: { name: tags[i] },
      });

      if (prevTag) tagsResult.push(prevTag);
      else {
        const newTag = await this.tagRepository.save({
          name: tags[i],
        });
        tagsResult.push(newTag);
      }
    }

    const keywordsResult = [];
    for (let i = 0; keywords && i < keywords.length; i++) {
      const prevKeyword = await this.keywordRepository.findOne({
        where: { name: keywords[i] },
      });

      if (prevKeyword) keywordsResult.push(prevKeyword);
      else {
        const newKeyword = await this.keywordRepository.save({
          name: keywords[i],
        });
        keywordsResult.push(newKeyword);
      }
    }

    const categoriesResult = [];
    for (let i = 0; categories && i < categories.length; i++) {
      const prevCategory = await this.categoryRepository.findOne({
        where: { name: categories[i] },
      });

      if (prevCategory) categoriesResult.push(prevCategory);
      else {
        const newKeyword = await this.categoryRepository.save({
          name: categories[i],
        });
        categoriesResult.push(newKeyword);
      }
    }

    const savedInfo = await this.boardRepository.save({
      ...board,
      leader: leader.id,
      leaderNickname: leader.nickname,
      boardImage: boardImageResult,
      tags: tagsResult,
      keywords: keywordsResult,
      categories: categoriesResult,
    });

    // userBoard에도 저장
    await this.userBoardRepository.save({
      user: leader,
      board: savedInfo.id,
      isAccepted: true,
    });

    return savedInfo;
  }

  async update({ boardId, updateBoardInput }) {
    const originBoard = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage", "tags", "keywords", "categories"],
    });
    const {
      tags: originTags,
      keywords: originKeywords,
      categories: originCategories,
    } = originBoard;

    const { boardImage, tags, keywords, categories, ...updateBoard } =
      updateBoardInput;

    const tagsResult = [];
    const keywordsResult = [];
    const categoriesResult = [];

    if (boardImage.url) {
      await this.boardImageRepository.update(
        {
          id: originBoard.boardImage.id,
        },
        {
          url: boardImage.url,
        }
      );
    }

    for (let i = 0; tags && i < tags.length; i++) {
      const prevTag = await this.tagRepository.findOne({
        where: { name: tags[i] },
      });

      if (prevTag) tagsResult.push(prevTag);
      else {
        const newTag = await this.tagRepository.save({
          name: tags[i],
        });
        tagsResult.push(newTag);
      }
    }

    for (let i = 0; keywords && i < keywords.length; i++) {
      const prevKeyword = await this.keywordRepository.findOne({
        where: { name: keywords[i] },
      });

      if (prevKeyword) keywordsResult.push(prevKeyword);
      else {
        const newKeyword = await this.keywordRepository.save({
          name: keywords[i],
        });
        keywordsResult.push(newKeyword);
      }
    }

    for (let i = 0; categories && i < categories.length; i++) {
      const prevCategory = await this.categoryRepository.findOne({
        where: { name: categories[i] },
      });

      if (prevCategory) categoriesResult.push(prevCategory);
      else {
        const newKeyword = await this.categoryRepository.save({
          name: categories[i],
        });
        categoriesResult.push(newKeyword);
      }
    }

    originTags.push(...tagsResult);
    originKeywords.push(...keywordsResult);
    originCategories.push(...categoriesResult);

    if (updateBoard.isSuccess) {
      const curr = new Date();
      const KR_TIME = 9 * 60 * 60 * 1000;
      updateBoard.endAt = new Date(curr.getTime() + KR_TIME);
    }

    const updatedInfo = this.boardRepository.save({
      ...originBoard,
      ...updateBoard,
      boardImage: boardImage,
      tags: originTags,
      keywords: originKeywords,
      categories: originCategories,
    });
    return updatedInfo;
  }

  async remove({ boardId }) {
    // softDelete ( id가 아닌 다른 요소로도 삭제 가능 )
    const result = await this.boardRepository.softDelete({ id: boardId });
    return result.affected ? true : false;
  }
}
