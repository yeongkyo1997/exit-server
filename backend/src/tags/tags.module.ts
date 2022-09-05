import { Module } from "@nestjs/common";
import { TagsService } from "./tags.service";
import { TagsResolver } from "./tags.resolver";
import { Tag } from "./entities/tag.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag, //
    ]),
  ],
  providers: [TagsResolver, TagsService],
})
export class TagsModule {}
