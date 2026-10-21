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

  @Query(() => String)
  getLocationCrew(
    @Args("boardId") boardId: string, //
    @Args("userId") userId: string
  ) {
    return this.attendanceService.getLocationCrew({ boardId, userId });
  }

  @Query(() => String)
  async getLocationLeader(@Args("boardId") boardId: string) {
    return this.attendanceService.getLocationLeader({ boardId });
  }

  @Query(() => [Attendance])
  async fetchAttendance(@Args("boardId") boardId: string) {
    return this.attendanceService.getAttendanceList({ boardId });
  }
}
