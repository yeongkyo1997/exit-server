import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
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
    private readonly keywordRepository: Repository<Keyword>
  ) {}
  findAll() {
    return this.boardRepository.find({
      relations: ["boardImage", "tags", "users", "keywords"],
    });
  }

  findOne({ boardId }) {
    return this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage", "tags", "users", "keywords"],
    });
  }

  async create({ createBoardInput }) {
    const { image, tags, users, keywords, ...board } = createBoardInput;

    // 썸네일 저장 후 이미지DB에 저장하는 로직
    // await ...

    // 다대다 확인 후 등록 로직
    const tagsResult = [];
    for (let i = 0; i < tags.length; i++) {
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
    for (let i = 0; i < keywords.length; i++) {
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

    const savedInfo = await this.boardRepository.save({
      ...board,
      tags: tagsResult,
      keywords: keywordsResult,
      users: users,
      boardImage: image,
    });

    return savedInfo;
  }

  async update({ boardId, updateBoardInput }) {
    const originBoard = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage", "tags", "users", "keywords"],
    });

    const {
      tags: originTags,
      users: originUsers,
      keywords: originKeywords,
    } = originBoard;
    const { image, tags, users, keywords, ...updateBoard } = updateBoardInput;

    const tagsResult = [];
    const keywordsResult = [];

    if (tags) {
      for (let i = 0; i < tags.length; i++) {
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
    }

    if (keywords) {
      for (let i = 0; i < keywords.length; i++) {
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
    }

    originTags.push(...tagsResult);
    originKeywords.push(...keywordsResult);
    originUsers.push(...users);

    const updatedInfo = this.boardRepository.save({
      ...originBoard,
      ...updateBoard,
      tags: originTags,
      users: originUsers,
      keywords: originKeywords,
      boardImage: image,
    });
    return updatedInfo;
  }

  async remove({ boardId }) {
    // softDelete ( id가 아닌 다른 요소로도 삭제 가능 )
    const result = await this.boardRepository.softDelete({ id: boardId });
    return result.affected ? true : false;
  }
}
