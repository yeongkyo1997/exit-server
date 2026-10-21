import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { graphqlUploadExpress } from "graphql-upload";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { ALLOWED_ORIGINS } from "./commons/constants";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(graphqlUploadExpress());
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
  await app.listen(3000);
}
bootstrap();
