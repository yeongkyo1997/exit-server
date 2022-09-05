import { Module } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoriesResolver } from "./categories.resolver";
import { Category } from "./entities/category.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category, //
      Board,
    ]),
  ],
  providers: [CategoriesResolver, CategoriesService],
})
export class CategoriesModule {}
