import { Module } from "@nestjs/common";
import { TagImagesService } from "./tag-images.service";
import { TagImagesResolver } from "./tag-images.resolver";
import { FileUploadsService } from "src/fileUpload/fileUpload.service";

@Module({
  providers: [TagImagesResolver, TagImagesService, FileUploadsService],
})
export class TagImagesModule {}
