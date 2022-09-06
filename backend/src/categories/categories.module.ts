import { Module } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoriesResolver } from "./categories.resolver";
import { Category } from "./entities/category.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category, //
      Board,
      User,
    ]),
  ],
  providers: [CategoriesResolver, CategoriesService],
})
export class CategoriesModule {}
