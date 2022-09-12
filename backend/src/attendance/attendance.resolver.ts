import { CACHE_MANAGER, Inject, UseGuards } from "@nestjs/common";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { Cache } from "cache-manager";
import { AttendanceService } from "./attendance.service";
import { BoardsService } from "src/boards/boards.service";

@Resolver()
export class AttendanceResolver {
  constructor(
    private readonly attendanceService: AttendanceService, //
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache, //
    private readonly boardService: BoardsService
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => Boolean)
  async checkGps(
    @Args("latitude") latitude: number,
    @Args("longitude") longitude: number,
    @Args("boardId") boardId: string,
    @Context() context: any
  ) {
    const user = context.req.user;

    const board = await this.boardService.findOne({ boardId });

    const validate = await this.attendanceService.effectiveUser({ user });
    if (!validate) {
      throw new Error("유효하지 않은 유저입니다.");
    }
    

    // 리더가 아니고(팀원일 경우) 리더가 캐시에 없으면 error
    if (board.leader !== user.id) {
      // 이미 출석한 유저인지 확인
      if (!this.attendanceService.checkAttendance({ user })) {
        throw new Error("이미 출석한 유저입니다.");
      }
      // 리더를 레디스에서 찾기
      const isLeader = await this.cacheManager.get(board.leader);

      // 리더가 레디스에 없는 경우
      if (!isLeader) {
        throw new Error("팀장이 출석을 활성화하지 않았습니다.");
      }

      // 리더가 레디스에 있는 경우
      else {
        // 출석 체크
        return this.attendanceService.checkLocation({
          user,
          latitude,
          longitude,
          board,
        });
      }
    }

    // 리더인 경우
    else {
      // 이미 출석한 경우
      const isUser = await this.cacheManager.get(user.id);
      if (isUser) throw new Error("이미 출석이 활성화되었습니다.");

      // 레디스에 위도 경도를 저장하고 ttl을 10분으로 설정
      await this.cacheManager.set(user.id, `${latitude},${longitude}`, {
        ttl: 600,
      });
      await this.cacheManager.set(boardId, 1, { ttl: 600 });
      await this.attendanceService.checkLocation({
        user,
        latitude,
        longitude,
        board,
      });
      return true;
    }
  }

  @Query(() => Number)
  async getAttendanceCount(@Args("boardId") boardId: string) {
    return this.attendanceService.getAttendanceCount({ boardId });
  }

  @Query(() => String)
  async getAttendanceTime(@Args("boardId") boardId: string) {
    return this.attendanceService.getRemainingTime({ boardId });
  }
}
