import { Module } from "@nestjs/common";
import { KeywordsService } from "./keywords.service";
import { KeywordsResolver } from "./keywords.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Keyword } from "./entities/keyword.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Keyword, //
    ]),
  ],
  providers: [KeywordsResolver, KeywordsService],
})
export class KeywordsModule {}
