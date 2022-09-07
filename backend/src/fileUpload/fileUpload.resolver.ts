import { Resolver, Mutation, Args } from "@nestjs/graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { FileUploadsService } from "./fileUpload.service";

@Resolver()
export class FileUploadsResolver {
  constructor(
    private readonly fileUploadsService: FileUploadsService //
  ) {}

  @Mutation(() => [String])
  async uploadFiles(
    @Args({ name: "file", type: () => [GraphQLUpload] }) file: FileUpload[]
  ) {
    return await this.fileUploadsService.upload({ file });
  }
}
