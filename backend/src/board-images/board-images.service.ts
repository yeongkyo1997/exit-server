import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { FilesService } from "src/files/files.service";
import { Repository } from "typeorm";
import { BoardImage } from "./entities/board-image.entity";

@Injectable()
export class BoardImagesService {
  constructor(
    @InjectRepository(BoardImage)
    private readonly boardImageRepository: Repository<BoardImage>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    private readonly filesService: FilesService
  ) {}

  async create({ image }) {
    const url = await this.filesService.upload({ file: image, type: "board" });
    return url[0].toString();
  }

  async findOne({ boardImageId }) {
    return await this.boardImageRepository.findOne({
      where: { id: boardImageId },
    });
  }

  async findAll() {
    return await this.boardImageRepository.find({});
  }

  async delete({ boardImageId, userId }) {
    // 값이 비면 TypeORM이 where 조건을 빼 버려 엉뚱한 행이 잡히므로 먼저 막는다
    if (!boardImageId || !userId)
      throw new UnprocessableEntityException("존재하지 않는 이미지입니다.");

    // 이 이미지를 썸네일로 쓰는 게시글을 찾아 리더인지 확인한다
    const board = await this.boardRepository.findOne({
      where: { boardImage: { id: boardImageId } },
    });
    if (!board)
      throw new UnprocessableEntityException("존재하지 않는 이미지입니다.");
    if (board.leader !== userId)
      throw new ForbiddenException(
        "프로젝트 리더만 이미지를 삭제할 수 있습니다."
      );

    const boardImage = await this.boardImageRepository.findOne({
      where: { id: boardImageId },
    });
    if (!boardImage) {
      throw new UnprocessableEntityException("존재하지 않는 이미지입니다.");
    }
    const result = await this.boardImageRepository.softDelete({
      id: boardImageId,
    });
    return !!result.affected;
  }
}
