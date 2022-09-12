import { Module } from "@nestjs/common";
import { TempService } from "./temp.service";
import { TempResolver } from "./temp.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tag } from "src/tags/entities/tag.entity";
import { Category } from "src/categories/entities/category.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag, //
      Category,
    ]),
  ],
  providers: [
    TempResolver, //
    TempService,
  ],
})
export class TempModule {}
