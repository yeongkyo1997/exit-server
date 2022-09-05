import { Module } from "@nestjs/common";
import { UserImagesService } from "./user-images.service";
import { UserImagesResolver } from "./user-images.resolver";
import { UserImage } from "./entities/user-image.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([UserImage])],
  providers: [UserImagesResolver, UserImagesService],
})
export class UserImagesModule {}
