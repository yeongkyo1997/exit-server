import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatResolver } from "./chat.resolver";
import { ChatGateway } from "./chat.gateway";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatRoom } from "./entities/chatRoom.entity";
import { ChatMessage } from "./entities/chatMessage.entity";
import { User } from "src/users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom, //
      ChatMessage,
      User,
    ]),
  ],
  providers: [ChatResolver, ChatService, ChatGateway],
})
export class ChatModule {}
