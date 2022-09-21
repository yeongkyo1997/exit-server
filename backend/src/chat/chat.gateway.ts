import { Server } from "socket.io";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ChatMessage } from "./entities/chatMessage.entity";
import { User } from "src/users/entities/user.entity";

@WebSocketGateway({
  namespace: "chat",
  cors: {
    origin: [
      true,
      "http://localhost:3000",
      "http://localhost:5500",
      "https://ex1t.shop",
    ],
  },
})
@Injectable()
export class ChatGateway {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepositoey: Repository<User>
  ) {}

  @WebSocketServer()
  server: Server;

  wsClients = [];

  @SubscribeMessage("message")
  connectSomeone(
    @MessageBody() data: string //
  ) {
    const [nickname, room] = data; // 채팅방 입장!
    const receive = `${nickname}님이 입장했습니다.`;
    this.server.emit("receive" + room, receive);
    console.log(this.server, "server");
  }

  // private broadcast(event, client, message: any) {
  //   for (const c of this.wsClients) {
  //     if (client.id == c.id) continue;
  //     c.emit(event, message);
  //   }
  // }

  @SubscribeMessage("send")
  async sendMessage(
    @MessageBody() data: string //
  ) {
    const [room, nickname, message] = data;
    const user = await this.userRepositoey.findOne({
      where: { nickname: nickname },
    });

    await this.chatMessageRepository.save({
      user: { id: user.id },
      room: room,
      message: data[2],
    });

    this.server.emit(room, [nickname, message]);
  }
}
