import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { graphqlUploadExpress } from "graphql-upload";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import {
  ALLOWED_ORIGINS,
  UPLOAD_MAX_FILES,
  UPLOAD_MAX_FILE_SIZE,
} from "./commons/constants";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // multipart는 가드보다 먼저 임시 디스크에 기록되므로 크기·개수 제한이 필수다 (넘으면 413)
  app.use(
    graphqlUploadExpress({
      maxFileSize: UPLOAD_MAX_FILE_SIZE,
      maxFiles: UPLOAD_MAX_FILES,
    })
  );
  app.enableCors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Access-Control-Allow-Headers",
      "Authorization",
      "X-Requested-With",
      "Content-Type",
      "Accept",
    ],
    credentials: true,
    origin: ALLOWED_ORIGINS,
    exposedHeaders: ["Authorization", "Set-Cookie", "Cookie"],
  });
  app.useStaticAssets(join(__dirname, "..", "static"));
  await app.listen(Number(process.env.PORT) || 3000);
}
bootstrap();
