import { Module } from "@nestjs/common";
import { TagsService } from "./tags.service";
import { TagsResolver } from "./tags.resolver";
import { Tag } from "./entities/tag.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TagImage } from "src/tag-images/entities/tag-image.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag, //
      TagImage,
    ]),
  ],
  providers: [TagsResolver, TagsService],
})
export class TagsModule {}
