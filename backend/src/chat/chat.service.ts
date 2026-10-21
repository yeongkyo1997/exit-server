import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatRoom } from "./entities/chatRoom.entity";
import { ChatMessage } from "./entities/chatMessage.entity";
import { v4 } from "uuid";
import { User } from "src/users/entities/user.entity";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,

    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>
  ) {}

  async create({ nickname, currentUser }) {
    const host = await this.userRepository.findOne({
      where: { id: currentUser.id },
    });

    const opponent = await this.userRepository.findOne({
      where: { nickname },
    });
    const uuid = v4();
    const result = await this.chatRoomRepository.save({
      room: uuid,
      user: host,
    });

    await this.chatRoomRepository.save({
      room: result.room,
      user: opponent,
    });

    return result;
  }

  async join({ currentUser, hostNickname }) {
    const user = await this.userRepository.findOne({
      where: { nickname: hostNickname },
    });

    const host = await this.chatRoomRepository.find({
      where: { user: { id: user.id } },
    });

    const me = await this.chatRoomRepository.find({
      where: { user: { id: currentUser.id } },
    });

    // 겹치는 방이 여러 개면 host 순서상 마지막 방
    const myRooms = new Set(me.map((el) => el.room));
    return host.filter((el) => myRooms.has(el.room)).pop();
  }

  async load({ room }) {
    return await this.chatMessageRepository.find({
      where: { room: room },
      order: { createdAt: "ASC" },
      relations: ["user"],
    });
  }
}
