import { CreatePointHistoryInput } from "./create-point-history.input";
import { InputType, PartialType } from "@nestjs/graphql";

@InputType()
export class UpdatePointHistoryInput extends PartialType(
  CreatePointHistoryInput
) {}
