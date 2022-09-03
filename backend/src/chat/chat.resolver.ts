import { UseGuards } from "@nestjs/common";
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
  fetchLogs(@Args("room") room: string) {
    return this.chatService.load({ room });
  }
}
