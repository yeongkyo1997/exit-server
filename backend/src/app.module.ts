import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { CacheModule, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import "dotenv/config";
import { GraphQLModule } from "@nestjs/graphql";
import { UsersModule } from "./users/users.module";
import { BoardsModule } from "./boards/boards.module";
import { KeywordsModule } from "./keywords/keywords.module";
import { TagsModule } from "./tags/tags.module";
import { CategoriesModule } from "./categories/categories.module";
import { LikesModule } from "./likes/likes.module";
import { PaymentsModule } from "./payments/payments.module";
import { UserUrlsModule } from "./user-urls/user-urls.module";
import { UserImagesModule } from "./user-images/user-images.module";
import { BoardImagesModule } from "./board-images/board-images.module";
import { CommentsModule } from "./comments/comments.module";
import { SubCommentsModule } from "./sub-comments/sub-comments.module";
import * as redisStore from "cache-manager-redis-store";
import { RedisClientOptions } from "redis";
import { AuthsModule } from "./auths/auths.module";
import { EmailModule } from "./email/email.module";
import { IamportService } from "./iamport/iamport.service";
import { ChatModule } from "./chat/chat.module";
import { UserBoardModule } from "./userBoard/userBoard.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: "src/commons/graphql/schema.gql",
      context: ({ req, res }) => ({ req, res }),
    }),
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE as "mysql",
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
      entities: [__dirname + "/**/*.entity.*"],
      synchronize: true,
      logging: true,
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      url: "redis://team-redis:6379",
      isGlobal: true,
    }),
    AuthsModule,
    UsersModule,
    BoardsModule,
    KeywordsModule,
    TagsModule,
    CategoriesModule,
    LikesModule,
    PaymentsModule,
    UserUrlsModule,
    UserImagesModule,
    BoardImagesModule,
    CommentsModule,
    SubCommentsModule,
    EmailModule,
    ChatModule,
    UserBoardModule,
  ],
  providers: [IamportService],
  controllers: [AppController],
})
export class AppModule {}
