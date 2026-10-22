import { Namespace, Socket } from "socket.io";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { CACHE_MANAGER, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from "cache-manager";
import { Repository } from "typeorm";
import { ChatMessage } from "./entities/chatMessage.entity";
import { ChatService } from "./chat.service";
import { User } from "src/users/entities/user.entity";
import { ALLOWED_ORIGINS } from "src/commons/constants";
import {
  socketAccessToken,
  verifyAccessToken,
} from "src/commons/auth/token.utils";
import { AuthUser } from "src/commons/type/context";

// 메시지 한 개의 최대 길이 (longtext에 1MB짜리 메시지가 쌓이지 않게)
const CHAT_MESSAGE_MAX_LENGTH = 1000;

// CHAT_REQUIRE_AUTH가 정확히 "true"일 때만 토큰 없는(또는 무효한 토큰의) 소켓을 거부한다
const chatRequiresAuth = () => process.env.CHAT_REQUIRE_AUTH === "true";

// 로그인한 소켓을 접속 때 넣어 두는 개인 room (채팅방 id인 v4 uuid, socket id와 겹치지 않는다)
const userRoom = (userId: string) => `user:${userId}`;

// CORS는 polling에만 적용되고 websocket upgrade에는 적용되지 않는다.
// 접근 통제는 핸드셰이크 토큰 검증과 채팅방 참여자 확인이 담당한다
@WebSocketGateway({
  namespace: "chat",
  cors: {
    origin: ALLOWED_ORIGINS,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  @WebSocketServer()
  server: Namespace;

  // 연결 전에 access 토큰을 확인한다. handleConnection은 Nest가 await하지 않아 메시지 핸들러와 경쟁하므로 미들웨어로 한다.
  // 토큰은 io(url, { auth: { token } }) 또는 Authorization 헤더로 받는다 (쿼리스트링은 받지 않고, 토큰은 로그에 남기지 않는다)
  afterInit(server: Namespace) {
    server.use((socket, next) => {
      verifyAccessToken(
        this.jwtService,
        this.cacheManager,
        socketAccessToken(socket.handshake)
      ).then(
        (user) => {
          // CHAT_REQUIRE_AUTH === "true"(정확히)일 때만 미인증 소켓을 거부한다
          if (!user && chatRequiresAuth())
            return next(new Error("Unauthorized"));
          socket.data.user = user; // AuthUser | null (null = 미인증, 플래그가 꺼져 있을 때만)
          next();
        },
        () => next(new Error("Unauthorized"))
      );
    });
  }

  // 로그인한 소켓은 자기 개인 room에 넣는다 (접속 뒤에 생긴 채팅방의 메시지도 입장 없이 받는다)
  handleConnection(client: Socket) {
    const me: AuthUser | null = client.data.user ?? null;
    if (me?.id) client.join(userRoom(me.id));
  }

  // 보낸 사람을 정하고 이 채팅방의 참여자인지 확인한다.
  // - 토큰으로 인증된 소켓: 토큰의 유저(닉네임은 DB의 현재 값). 클라이언트가 보낸 nickname은 무시한다 (플래그와 무관)
  // - 미인증 소켓(CHAT_REQUIRE_AUTH가 꺼져 있을 때만 접속된다): nickname이 비어 있지 않은 문자열이고 이 방 참여자의 닉네임이어야 한다
  private async resolveSender(
    client: Socket,
    room: unknown,
    nickname: unknown
  ) {
    if (typeof room !== "string" || !room)
      throw new WsException("채팅방 정보가 없습니다.");

    const members = await this.chatService.findMembers(room);

    const me: AuthUser | null = client.data.user ?? null;
    if (me) {
      if (
        typeof me.id !== "string" ||
        !me.id ||
        !members.some((member) => member.id === me.id)
      )
        throw new WsException("참여하지 않은 채팅방입니다.");

      const user = await this.userRepository.findOne({
        where: { id: me.id },
      });
      if (!user) throw new WsException("Unauthorized");
      return { user, room, members };
    }

    if (chatRequiresAuth()) throw new WsException("Unauthorized");
    if (typeof nickname !== "string" || !nickname)
      throw new WsException("닉네임 정보가 없습니다.");

    const user = members.find((member) => member.nickname === nickname);
    if (!user) throw new WsException("참여하지 않은 채팅방입니다.");
    return { user, room, members };
  }

  // 이 채팅방에 입장한 소켓과 참여자들의 개인 room에만 보낸다 (네임스페이스 전체 전송 금지)
  private toRoom(room: string, members: User[]) {
    return this.server.to([room, ...members.map((el) => userRoom(el.id))]);
  }

  @SubscribeMessage("message")
  async connectSomeone(
    @MessageBody() data: unknown, //
    @ConnectedSocket() client: Socket
  ) {
    // 채팅방 입장! payload: [nickname, room] (인증된 소켓은 nickname을 무시한다)
    const [nickname, room] = Array.isArray(data) ? data : [];
    const sender = await this.resolveSender(client, room, nickname);

    client.join(sender.room);
    const receive = `${sender.user.nickname}님이 입장했습니다.`;
    this.toRoom(sender.room, sender.members).emit(
      "receive" + sender.room,
      receive
    );
  }

  @SubscribeMessage("send")
  async sendMessage(
    @MessageBody() data: unknown, //
    @ConnectedSocket() client: Socket
  ) {
    // payload: [room, nickname, message] (인증된 소켓은 nickname을 무시한다)
    if (!Array.isArray(data)) throw new WsException("잘못된 요청입니다.");
    const [room, nickname, message] = data;
    if (typeof message !== "string" || !message)
      throw new WsException("메시지를 입력해주세요.");
    if (message.length > CHAT_MESSAGE_MAX_LENGTH)
      throw new WsException("메시지가 너무 깁니다.");

    const sender = await this.resolveSender(client, room, nickname);
    client.join(sender.room);

    await this.chatMessageRepository.save({
      user: { id: sender.user.id },
      room: sender.room,
      message,
    });

    this.toRoom(sender.room, sender.members).emit(sender.room, [
      sender.user.nickname,
      message,
    ]);
  }
}
