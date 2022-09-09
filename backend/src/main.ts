import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { graphqlUploadExpress } from "graphql-upload";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(graphqlUploadExpress());
  app.enableCors({
    credentials: true,
    origin: "*",
    exposedHeaders: ["Authorization", "Set-Cookie", "Cookie"],
  });
  app.useStaticAssets(join(__dirname, "..", "static"));
  await app.listen(3000);
}
bootstrap();
