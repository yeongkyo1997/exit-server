import { Module } from "@nestjs/common";
import { BoardImagesService } from "./board-images.service";
import { BoardImagesResolver } from "./board-images.resolver";
import { BoardImage } from "./entities/board-image.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesService } from "src/files/files.service";

@Module({
  imports: [TypeOrmModule.forFeature([BoardImage])],
  providers: [BoardImagesResolver, BoardImagesService, FilesService],
})
export class BoardImagesModule {}
