import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";
import { GqlAuthAccessGuard } from "src/commons/auth/gql-auth.guard";
import { CurrentUser } from "src/commons/auth/current-user.decorator";
import { AuthUser } from "src/commons/type/context";
import { AttendanceService } from "./attendance.service";
import { Attendance } from "./entities/attendance.entity";

@Resolver()
export class AttendanceResolver {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => Boolean)
  async checkGps(
    @Args("latitude") latitude: number,
    @Args("longitude") longitude: number,
    @Args("boardId") boardId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.attendanceService.checkIn({
      user,
      latitude,
      longitude,
      boardId,
    });
  }

  @Query(() => Number)
  async getAttendanceCount(@Args("boardId") boardId: string) {
    return this.attendanceService.getAttendanceCount({ boardId });
  }

  @Query(() => Number)
  async getAttendancePercent(@Args("boardId") boardId: string) {
    return this.attendanceService.getAttendancePercent({ boardId });
  }

  @Query(() => String)
  async getAttendanceTime(@Args("boardId") boardId: string) {
    return this.attendanceService.getRemainingTime({ boardId });
  }

  // 출석 위치(좌표)는 로그인한 그 프로젝트의 팀장이나 승인된 팀원만 볼 수 있다
  @UseGuards(GqlAuthAccessGuard)
  @Query(() => String)
  async getLocationCrew(
    @Args("boardId") boardId: string, //
    @Args("userId") userId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.attendanceService.assertBoardMember({
      boardId,
      userId: user.id,
    });
    return this.attendanceService.getLocationCrew({ boardId, userId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => String)
  async getLocationLeader(
    @Args("boardId") boardId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.attendanceService.assertBoardMember({
      boardId,
      userId: user.id,
    });
    return this.attendanceService.getLocationLeader({ boardId });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [Attendance])
  async fetchAttendance(
    @Args("boardId") boardId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.attendanceService.assertBoardMember({
      boardId,
      userId: user.id,
    });
    return this.attendanceService.getAttendanceList({ boardId });
  }
}
