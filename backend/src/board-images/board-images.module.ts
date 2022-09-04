import { Module } from "@nestjs/common";
import { BoardImagesService } from "./board-images.service";
import { BoardImagesResolver } from "./board-images.resolver";
import { BoardImage } from "./entities/board-image.entity";

@Module({
  imports: [BoardImage],
  providers: [BoardImagesResolver, BoardImagesService],
})
export class BoardImagesModule {}
