import { Module } from "@nestjs/common";
import { UserImagesService } from "./user-images.service";
import { UserImagesResolver } from "./user-images.resolver";
import { UserImage } from "./entities/user-image.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesModule } from "src/files/files.module";
import { User } from "src/users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserImage, User]), FilesModule],
  providers: [UserImagesResolver, UserImagesService],
})
export class UserImagesModule {}
