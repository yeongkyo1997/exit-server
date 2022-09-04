import { Injectable } from "@nestjs/common";
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
  findAll({ isSuccess, status }) {
    if (isSuccess != undefined && status != undefined) {
      return this.boardRepository.find({
        relations: ["boardImage", "tags", "keywords"],
        where: {
          isSuccess: isSuccess,
          status: status,
        },
      });
    } else if (isSuccess != undefined) {
      return this.boardRepository.find({
        relations: ["boardImage", "tags", "keywords"],
        where: { isSuccess: isSuccess },
      });
    } else if (status != undefined) {
      return this.boardRepository.find({
        relations: ["boardImage", "tags", "keywords"],
        where: { status: status },
      });
    } else {
      return this.boardRepository.find({
        relations: ["boardImage", "tags", "keywords"],
      });
    }
  }

  findOne({ boardId }) {
    return this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage", "tags", "keywords"],
    });
  }

  async create({ createBoardInput }) {
    const { image, tags, keywords, ...board } = createBoardInput;

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
      boardImage: image,
      tags: tagsResult,
      keywords: keywordsResult,
    });

    return savedInfo;
  }

  async update({ boardId, updateBoardInput }) {
    const originBoard = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage", "tags", "keywords"],
    });

    const { tags: originTags, keywords: originKeywords } = originBoard;
    const { image, tags, keywords, ...updateBoard } = updateBoardInput;

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

    const updatedInfo = this.boardRepository.save({
      ...originBoard,
      ...updateBoard,
      boardImage: image,
      tags: originTags,
      keywords: originKeywords,
    });
    return updatedInfo;
  }

  async remove({ boardId }) {
    // softDelete ( id가 아닌 다른 요소로도 삭제 가능 )
    const result = await this.boardRepository.softDelete({ id: boardId });
    return result.affected ? true : false;
  }
}
