import { Module } from "@nestjs/common";
import { UsersModule } from "src/users/users.module";
import { EmailResolver } from "./email.resolver";
import { EmailService } from "./email.service";

@Module({
  imports: [UsersModule],
  providers: [
    EmailResolver, //
    EmailService,
  ],
})
export class EmailModule {}
