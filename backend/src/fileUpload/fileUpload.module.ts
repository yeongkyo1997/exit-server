import { Module } from "@nestjs/common";
import { FileUploadsResolver } from "./fileUpload.resolver";
import { FileUploadsService } from "./fileUpload.service";

@Module({
  providers: [FileUploadsResolver, FileUploadsService],
})
export class FileUploadsModule {}
