import { Module } from "@nestjs/common";
import { UserImagesService } from "./user-images.service";
import { UserImagesResolver } from "./user-images.resolver";
import { UserImage } from "./entities/user-image.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesService } from "src/files/files.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserImage])],
  providers: [UserImagesResolver, UserImagesService, FilesService],
})
export class UserImagesModule {}
