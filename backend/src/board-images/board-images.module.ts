import { Module } from "@nestjs/common";
import { BoardImagesService } from "./board-images.service";
import { BoardImagesResolver } from "./board-images.resolver";

@Module({
  providers: [BoardImagesResolver, BoardImagesService],
})
export class BoardImagesModule {}
