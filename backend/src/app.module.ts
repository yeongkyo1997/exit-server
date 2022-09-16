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
import { ConfigModule } from "@nestjs/config";
import { AttendanceModule } from "./attendance/attendance.module";
import { TempModule } from "./temp/temp.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: "src/commons/graphql/schema.gql",
      context: ({ req, res }) => ({ req, res }),
      cors: {
        origin: ["http://localhost:3000", "https://ex1t.shop"],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        //exposedHeaders: ["Set-Cookie", "Cookie"], 실험용(배포시 반드시 지워야 함!)
      },
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
      timezone: "Z",
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      isGlobal: true,
    }),
    AuthsModule,
    UsersModule,
    BoardsModule,
    CategoriesModule,
    ChatModule,
    KeywordsModule,
    TagsModule,
    LikesModule,
    PaymentsModule,
    UserUrlsModule,
    UserImagesModule,
    BoardImagesModule,
    CommentsModule,
    SubCommentsModule,
    EmailModule,
    UserBoardModule,
    AttendanceModule,
    TempModule,
  ],
  providers: [IamportService],
  controllers: [AppController],
})
export class AppModule {}
