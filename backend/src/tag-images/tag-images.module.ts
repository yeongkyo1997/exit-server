import { Module } from "@nestjs/common";
import { TagImagesService } from "./tag-images.service";
import { TagImagesResolver } from "./tag-images.resolver";
import { FileUploadsService } from "src/fileUpload/fileUpload.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TagImage } from "./entities/tag-image.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TagImage])],
  providers: [TagImagesResolver, TagImagesService, FileUploadsService],
})
export class TagImagesModule {}
