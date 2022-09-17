import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AttendanceService } from "src/attendance/attendance.service";
import { BoardImage } from "src/board-images/entities/board-image.entity";
import { Category } from "src/categories/entities/category.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { PointHistory } from "src/point-history/entities/point-history.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { User } from "src/users/entities/user.entity";
import { DataSource, Repository } from "typeorm";
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
    private readonly boardImageRepository: Repository<BoardImage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly dataSource: DataSource,
    private readonly attendanceService: AttendanceService
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
      order: { createdAt: "DESC" },
      relations: ["boardImage", "tags", "keywords", "categories"],
      take: 10,
      skip: (page - 1) * 10 || 0,
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
      skip: (page - 1) * 10 || 0,
    });
  }

  findOne({ boardId }) {
    return this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage", "tags", "keywords", "categories"],
    });
  }

  async findOneByCategory({ userId, categoryId }) {
    // 모집중인 프로젝트들
    const waitingInfo = await this.boardRepository.find({
      where: {
        isSuccess: false,
        status: false,
      },
      relations: ["boardImage", "tags", "keywords", "categories"],
    });

    // 카테고리가 포함된 프로젝트들
    const filtTemp = await this.dataSource
      .createQueryBuilder()
      .select("boardId")
      .from("board_categories_category", "bc")
      .where("categoryId = :categoryId", {
        categoryId: categoryId,
      })
      .execute();

    const filt = [];
    if (filtTemp.length)
      for (const i of filtTemp) {
        filt.push(i.boardId);
      }

    //내가 지원하거나 포함된 프로젝트들
    const appliedTemp = await this.userBoardRepository.find({
      where: { user: { id: userId } },
      relations: ["user", "board"],
    });

    const applied = [];
    if (appliedTemp.length)
      for (const i of appliedTemp) {
        applied.push(i.board.id);
      }

    const filteredInfo = waitingInfo.filter(
      (ele) => filt.includes(ele.id) && !applied.includes(ele.id)
    );

    return filteredInfo[Math.floor(Math.random() * filteredInfo.length)];
  }

  async create({ leader, createBoardInput }) {
    const { boardImage, tags, keywords, categories, ...board } =
      createBoardInput;

    if (board.bail < 50000 || board.bail > 1000000)
      throw Error("보석금이 범위 밖입니다.");
    if (board.totalMember < 1 || board.totalMember > 6)
      throw Error("보석금이 범위 밖입니다.");
    if (board.frequency < 1 || board.frequency > 7)
      throw Error("보석금이 범위 밖입니다.");
    if (board.closedAt > board.endAt)
      throw Error("모집 마감일이 프로젝트 시작일보다 빠릅니다.");

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

  async update({ leader, boardId, updateBoardInput }) {
    const originBoard = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ["boardImage"],
    });

    const { boardImage, tags, keywords, categories, ...updateBoard } =
      updateBoardInput;

    if (originBoard.leader != leader.id) throw Error("작성자가 아닙니다.");
    if (updateBoard.bail < 50000 || updateBoard.bail > 1000000)
      throw Error("보석금이 범위 밖입니다.");
    if (updateBoard.totalMember < 1 || updateBoard.totalMember > 6)
      throw Error("보석금이 범위 밖입니다.");
    if (updateBoard.frequency < 1 || updateBoard.frequency > 7)
      throw Error("보석금이 범위 밖입니다.");
    if (updateBoard.closedAt > updateBoard.endAt)
      throw Error("모집 마감일이 프로젝트 시작일보다 빠릅니다.");

    await this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from("board_tags_tag")
      .where("boardId = :boardId", {
        boardId: boardId,
      })
      .execute();

    await this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from("board_keywords_keyword")
      .where("boardId = :boardId", {
        boardId: boardId,
      })
      .execute();

    await this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from("board_categories_category")
      .where("boardId = :boardId", {
        boardId: boardId,
      })
      .execute();

    if (boardImage.url != "null") {
      await this.boardImageRepository.update(
        {
          id: originBoard.boardImage.id,
        },
        {
          url: boardImage.url,
        }
      );
    }
    const tagsResult = [];
    const keywordsResult = [];
    const categoriesResult = [];

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

    // 성공했을 떄
    if (!originBoard.isSuccess && updateBoard.isSuccess) {
      updateBoard.endAt = new Date();

      // board에 성공 표시
      await this.boardRepository.update(
        {
          id: boardId,
        },
        {
          isSuccess: true,
          endAt: new Date(),
        }
      );

      // 성공한 유저들에게 보석 지급
      const successUsers = await this.userBoardRepository.find({
        where: { board: { id: boardId }, isAccepted: true },
        relations: ["user", "board"],
      });

      for (let i = 0; successUsers && i < successUsers.length; i++) {
        await this.userRepository.update(
          {
            id: successUsers[i].user.id,
          },
          {
            point: successUsers[i].user.point + originBoard.bail * 1.1,
          }
        );
      }

      // pointHistory에 저장
      for (let i = 0; successUsers && i < successUsers.length; i++) {
        await this.pointHistoryRepository.save({
          user: successUsers[i].user,
          amount: originBoard.bail * 1.1,
          pointHistory: "프로젝트 성공 보상",
        });
      }
    }

    // 프로젝트 모집마감
    if (!originBoard.status && updateBoard.status) {
      updateBoard.closedAt = new Date();

      // board에 모집 마감 표시
      await this.boardRepository.update(
        {
          id: boardId,
        },
        {
          status: true,
          closedAt: new Date(),
        }
      );

      // 모집 마감한 프로젝트에 승인한 유저들 포인트 차감
      const acceptedUsers = await this.userBoardRepository.find({
        where: { board: { id: boardId }, isAccepted: true },
        relations: ["user", "board"],
      });

      for (let i = 0; acceptedUsers && i < acceptedUsers.length; i++) {
        // 포인트 차감
        await this.userRepository.update(
          {
            id: acceptedUsers[i].user.id,
          },
          {
            point: acceptedUsers[i].user.point - originBoard.bail,
          }
        );

        // pointHistory에 저장
        await this.pointHistoryRepository.save({
          user: acceptedUsers[i].user,
          amount: -originBoard.bail,
          pointHistory: "프로젝트 참여 포인트 차감",
        });

        // 대기열에서 프로젝트에 참여한 유저들 삭제
        await this.userBoardRepository.delete({
          user: acceptedUsers[i].user,
          board: originBoard,
          isAccepted: false,
        });
      }
    }

    const updatedInfo = await this.boardRepository.save({
      ...originBoard,
      ...updateBoard,
      tags: tagsResult,
      keywords: keywordsResult,
      categories: categoriesResult,
    });

    return updatedInfo;
  }

  async remove({ leader, boardId }) {
    const originBoard = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (originBoard.leader != leader.id)
      throw Error("작성자만 지울 수 있습니다.");

    // softDelete ( id가 아닌 다른 요소로도 삭제 가능 )
    const result = await this.boardRepository.softDelete({ id: boardId });
    return result.affected ? true : false;
  }

  async onClickBoard({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) throw Error("존재하지 않는 게시물입니다.");

    // 출석률을 가지고온다.
    const attendancePercent =
      await this.attendanceService.getAllAttendancePercent({
        board,
      });

    if (attendancePercent < 80) {
      return false;
    }
    return true;
  }
}
