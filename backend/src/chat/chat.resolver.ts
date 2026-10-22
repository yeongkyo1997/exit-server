import { UseGuards } from "@nestjs/common";
import { Resolver, Query, Args, Mutation } from "@nestjs/graphql";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { AuthUser } from "src/commons/type/context";
import { ChatService } from "./chat.service";
import { ChatMessage } from "./entities/chatMessage.entity";
import { ChatRoom } from "./entities/chatRoom.entity";

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => ChatRoom)
  createRoom(
    @CurrentUser() user: AuthUser, //
    @Args("nickname") nickname: string
  ) {
    return this.chatService.create({ nickname, currentUser: user });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => ChatRoom)
  connectionRoom(
    @CurrentUser() user: AuthUser, //
    @Args("hostNickname") hostNickname: string
  ) {
    return this.chatService.join({ currentUser: user, hostNickname });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [ChatMessage])
  fetchLogs(
    @Args("room") room: string, //
    @CurrentUser() user: AuthUser
  ) {
    // 채팅방 참여자만 대화 내역을 볼 수 있다 (아니면 403)
    return this.chatService.load({ room, currentUser: user });
  }
}
