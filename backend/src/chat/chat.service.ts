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

    let result;
    for (let i = 0; i < host.length; i++) {
      for (let j = 0; j < me.length; j++) {
        if (host[i].room === me[j].room) {
          result = host[i];
        }
      }
    }

    return result;
  }

  async load({ room }) {
    const result = await this.chatMessageRepository.find({
      where: { room: room },
      order: { createdAt: "ASC" },
      relations: ["user"],
    });

    console.log(result, "result");
    return result;
  }
}
