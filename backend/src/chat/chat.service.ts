import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatRoom } from "./entities/chatRoom.entity";
import { ChatMessage } from "./entities/chatMessage.entity";
import { v4 } from "uuid";
import { User } from "src/users/entities/user.entity";
import { AuthUser } from "src/commons/type/context";

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

  // 채팅방 참여자(ChatRoom 행의 유저) 목록.
  // room이 비어 있으면 TypeORM 0.3.9가 조건을 버려 모든 방이 매칭되므로 조회하지 않는다
  async findMembers(room: string): Promise<User[]> {
    if (typeof room !== "string" || !room) return [];

    const rows = await this.chatRoomRepository.find({
      where: { room },
      relations: ["user"],
    });

    // 상대를 못 찾아 user가 비어 있는 행과 탈퇴한 유저는 뺀다
    const members = new Map<string, User>();
    rows.forEach((row) => {
      if (row.user?.id && !row.user.deletedAt)
        members.set(row.user.id, row.user);
    });
    return Array.from(members.values());
  }

  // 이 유저가 채팅방 참여자인지 (빈 값이면 false)
  async isMember({ room, userId }: { room: string; userId: string }) {
    if (typeof userId !== "string" || !userId) return false;
    const members = await this.findMembers(room);
    return members.some((member) => member.id === userId);
  }

  async load({ room, currentUser }: { room: string; currentUser: AuthUser }) {
    // 참여한 채팅방의 대화만 볼 수 있다
    if (!(await this.isMember({ room, userId: currentUser?.id }))) {
      throw new ForbiddenException("참여하지 않은 채팅방입니다.");
    }

    return await this.chatMessageRepository.find({
      where: { room: room },
      order: { createdAt: "ASC" },
      relations: ["user"],
    });
  }
}
