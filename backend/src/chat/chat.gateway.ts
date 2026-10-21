import { Server } from "socket.io";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatMessage } from "./entities/chatMessage.entity";
import { User } from "src/users/entities/user.entity";
import { ALLOWED_ORIGINS } from "src/commons/constants";

@WebSocketGateway({
  namespace: "chat",
  cors: {
    origin: [true, ...ALLOWED_ORIGINS, "http://localhost:5500"],
  },
})
export class ChatGateway {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage("message")
  connectSomeone(
    @MessageBody() data: string[] //
  ) {
    const [nickname, room] = data; // 채팅방 입장!
    const receive = `${nickname}님이 입장했습니다.`;
    this.server.emit("receive" + room, receive);
  }

  @SubscribeMessage("send")
  async sendMessage(
    @MessageBody() data: string[] //
  ) {
    const [room, nickname, message] = data;
    const user = await this.userRepository.findOne({
      where: { nickname: nickname },
    });

    await this.chatMessageRepository.save({
      user: { id: user.id },
      room: room,
      // 문자열이 오면 앞 세 글자에 서로게이트 쌍(이모지 등)이 있을 때 message(코드 포인트)와 data[2](코드 유닛)가 달라질 수 있어서 data[2]를 그대로 둔다
      message: data[2],
    });

    this.server.emit(room, [nickname, message]);
  }
}
