import { Server, Socket } from "socket.io";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import * as jwt from "jsonwebtoken";
import { ChatMessage } from "./entities/chatMessage.entity";
import { ChatService } from "./chat.service";

@WebSocketGateway({
  namespace: "chat",
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5500",
      "https://ex1t.shop",
    ],
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly chatService: ChatService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  @WebSocketServer()
  server: Server;

  // 연결 시 accessToken을 검증하고, 실패하면 연결을 끊는다.
  // 토큰은 io(url, { auth: { token } }) 또는 Authorization 헤더로 전달한다.
  async handleConnection(client: Socket) {
    try {
      const authorization = client.handshake.headers.authorization;
      const accessToken =
        client.handshake.auth?.token ?? authorization?.split(" ")[1];
      const payload = jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_SECRET
      ) as jwt.JwtPayload;

      // 로그아웃된 토큰인지 확인
      if (await this.cacheManager.get(`accessToken:${accessToken}`))
        throw new Error("logged out");

      client.data.user = { id: payload.sub, nickname: payload.nickname };
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage("message")
  async connectSomeone(
    @MessageBody() data: string[], //
    @ConnectedSocket() client: Socket
  ) {
    const [, room] = data; // 채팅방 입장!
    const user = client.data.user;

    // 채팅방 참여자만 입장할 수 있다
    const isMember = await this.chatService.isMember({ room, userId: user.id });
    if (!isMember) throw new WsException("채팅방 참여자가 아닙니다.");

    client.join(room);
    const receive = `${user.nickname}님이 입장했습니다.`;
    this.server.to(room).emit("receive" + room, receive);
  }

  @SubscribeMessage("send")
  async sendMessage(
    @MessageBody() data: string[], //
    @ConnectedSocket() client: Socket
  ) {
    const [room, , message] = data;
    const user = client.data.user;

    // 입장(message 이벤트)한 방에만 메시지를 보낼 수 있다
    if (!client.rooms.has(room))
      throw new WsException("입장하지 않은 채팅방입니다.");

    await this.chatMessageRepository.save({
      user: { id: user.id },
      room: room,
      message,
    });

    this.server.to(room).emit(room, [user.nickname, message]);
  }
}
