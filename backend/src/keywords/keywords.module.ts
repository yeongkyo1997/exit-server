import { Module } from '@nestjs/common';
import { KeywordsService } from './keywords.service';
import { KeywordsResolver } from './keywords.resolver';

@Module({
  providers: [KeywordsResolver, KeywordsService]
})
export class KeywordsModule {}
