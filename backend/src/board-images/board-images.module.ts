import { Module } from "@nestjs/common";
import { BoardImagesService } from "./board-images.service";
import { BoardImagesResolver } from "./board-images.resolver";
import { BoardImage } from "./entities/board-image.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesModule } from "src/files/files.module";
import { Board } from "src/boards/entities/board.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BoardImage, Board]), FilesModule],
  providers: [BoardImagesResolver, BoardImagesService],
})
export class BoardImagesModule {}
