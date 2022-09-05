import { CreateUserUrlInput } from "./create-user-url.input";
import { InputType, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdateUserUrlInput extends PartialType(CreateUserUrlInput) {}
