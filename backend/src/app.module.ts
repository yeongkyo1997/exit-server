import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { CacheModule, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import "dotenv/config";
import { GraphQLModule } from "@nestjs/graphql";
import { RedisClientOptions } from "redis";
import { UsersModule } from './users/users.module';
import * as redisStore from "cache-manager-redis-store";

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
      entities: [__dirname + "/apis/**/*.entity.*"],
      synchronize: true,
      logging: true,
    }),
//    CacheModule.register<RedisClientOptions>({
//      store: redisStore,
//      url: "redis://my-redis:6379",
//      isGlobal: true,
//    }),
    UsersModule,
  ],
})
export class AppModule {}
