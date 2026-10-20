import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Resolver, Query, Args, Mutation, Context } from "@nestjs/graphql";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { ChatService } from "./chat.service";
import { ChatMessage } from "./entities/chatMessage.entity";
import { ChatRoom } from "./entities/chatRoom.entity";

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => ChatRoom)
  createRoom(
    @Context() context: any, //
    @Args("nickname") nickname: string
  ) {
    const currentUser = {
      id: context.req.user.id,
      email: context.req.user.email,
    };
    return this.chatService.create({ nickname, currentUser });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => ChatRoom)
  connectionRoom(
    @Context() context: any, //
    @Args("hostNickname") hostNickname: string
  ) {
    const currentUser = {
      id: context.req.user.id,
      email: context.req.user.email,
    };
    return this.chatService.join({ currentUser, hostNickname });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [ChatMessage])
  async fetchLogs(
    @Args("room") room: string, //
    @Context() context: any
  ) {
    // 채팅방 참여자만 대화 내역을 볼 수 있다
    const isMember = await this.chatService.isMember({
      room,
      userId: context.req.user.id,
    });
    if (!isMember)
      throw new ForbiddenException("채팅방 참여자만 조회할 수 있습니다.");
    return this.chatService.load({ room });
  }
}
