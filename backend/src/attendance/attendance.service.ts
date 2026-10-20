import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from "cache-manager";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { DataSource, Repository } from "typeorm";
import { Attendance } from "./entities/attendance.entity";
import * as geolib from "geolib";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";

// 팀장이 출석을 활성화한 뒤 팀원이 출석할 수 있는 시간 (10분)
const ATTENDANCE_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache, //

    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,

    @InjectRepository(UserBoard)
    private readonly userBoardRepository: Repository<UserBoard>,

    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  async checkLocation({ user, latitude, longitude, board }) {
    const leader = board.leader;

    // 리더와 현재 유저의 위치를 비교한다
    const leaderLocation = await this.cacheManager.get(leader);
    if (!leaderLocation)
      throw new Error("팀장이 출석을 활성화하지 않았습니다.");

    const userLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    // 리더의 현재 위치를 start로 설정
    const start = {
      latitude: Number(leaderLocation.toString().split(",")[0]),
      longitude: Number(leaderLocation.toString().split(",")[1]),
    };

    // 두 위치의 거리를 계산
    const distance = geolib.isPointWithinRadius(start, userLocation, 100);

    // 출석이 가능한 거리인지 확인
    if (!distance) {
      throw new Error("출석이 불가능한 거리입니다.");
    } else {
      // 출석 테이블에 저장 (10분 출석 시간 계산을 위해 실제 시각을 저장한다)
      await this.attendanceRepository.save({
        nickname: user.nickname,
        userId: user.id,
        attendedAt: new Date(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        board,
      });

      return true;
    }
  }

  // 해당 보드에서 팀장이 가장 최근에 출석을 활성화한 기록
  getLeaderLatestAttendance({ board }) {
    return this.attendanceRepository.findOne({
      where: {
        userId: board.leader,
        board: { id: board.id },
      },
      order: {
        attendedAt: "DESC",
      },
    });
  }

  // 해당 프로젝트에 승인된 팀원인지 확인한다
  async assertBoardMember({ boardId, userId }) {
    const member = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        board: { id: boardId },
        isAccepted: true,
      },
    });
    if (!member)
      throw new ForbiddenException("프로젝트 팀원만 이용할 수 있습니다.");
  }

  async getAttendanceCount({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });

    // leader의 최근 출석기록을 가져온다
    const leaderAttendance = await this.getLeaderLatestAttendance({ board });
    if (!leaderAttendance) return 0;

    // leader의 출석기록을 기준으로 10분 이내에 이 보드에 출석한 유저들의 수를 가져온다
    const attendanceCount = await this.dataSource.manager
      .createQueryBuilder(Attendance, "attendance")
      .where("attendance.boardId = :boardId", { boardId })
      .andWhere(
        "attendance.attendedAt >= :attendedAt AND attendance.attendedAt <= :finish",
        {
          attendedAt: leaderAttendance.attendedAt,
          finish: new Date(
            leaderAttendance.attendedAt.getTime() + ATTENDANCE_WINDOW_MS
          ),
        }
      )
      .getCount();

    return attendanceCount;
  }

  async getAllAttendancePercent({ board }) {
    // 승인된 유저들의 수를 가져온다
    const userCount = await this.userBoardRepository.count({
      where: {
        board: { id: board.id },
        isAccepted: true,
      },
    });

    // 프로젝트 시작부터 지금(종료일이 지났으면 종료일)까지 지난 일수
    const DAY_MS = 1000 * 60 * 60 * 24;
    const until = Math.min(Date.now(), new Date(board.endAt).getTime());
    const elapsedDays = Math.max(
      0,
      (until - new Date(board.startAt).getTime()) / DAY_MS
    );

    // 유저 한 명이 지금까지 출석해야 하는 횟수 (주 frequency회 기준, 최소 1회)
    const expectedPerUser = Math.max(
      1,
      Math.floor((elapsedDays * board.frequency) / 7)
    );
    // 출석해야 하는 총 횟수를 계산한다.
    const totalAttendanceCount = expectedPerUser * userCount;
    // 현재까지 출석한 횟수를 가져온다.
    const attendanceCount = await this.attendanceRepository.count({
      where: {
        board: { id: board.id },
      },
    });

    if (totalAttendanceCount === 0) {
      return 0;
    }

    // 출석률을 계산한다.
    const attendancePercent = Math.min(
      100,
      Math.floor((attendanceCount / totalAttendanceCount) * 100)
    );

    return attendancePercent;
  }

  async getAttendancePercent({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });

    return this.getAllAttendancePercent({ board });
  }

  // 현재 출석 세션(팀장이 활성화한 시점 이후)에 이미 출석한 유저인지 확인
  async hasAttended({ board, userId }) {
    const leaderAttendance = await this.getLeaderLatestAttendance({ board });
    if (!leaderAttendance) return false;

    const attendance = await this.dataSource.manager
      .createQueryBuilder(Attendance, "attendance")
      .where("attendance.boardId = :boardId", { boardId: board.id })
      .andWhere("attendance.userId = :userId", { userId })
      .andWhere("attendance.attendedAt >= :attendedAt", {
        attendedAt: leaderAttendance.attendedAt,
      })
      .getOne();

    return !!attendance;
  }

  // board에 남은 출석 가능한 시간을 반환
  async getRemainingTime({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });

    // leader의 최근 출석기록을 가져온다
    const leaderAttendance = await this.getLeaderLatestAttendance({ board });
    if (!leaderAttendance) {
      throw new Error("출석 가능한 시간이 아닙니다.");
    }

    // leader의 출석시간을 기준으로 10분 이후의 시간
    const finish = new Date(
      leaderAttendance.attendedAt.getTime() + ATTENDANCE_WINDOW_MS
    );
    // 현재 시간과 10분 이후의 시간을 비교하여 남은 시간을 반환
    const remainingTime = finish.getTime() - Date.now();
    if (remainingTime < 0) {
      throw new Error("출석 가능한 시간이 아닙니다.");
    }

    return `${Math.floor(remainingTime / 60000)}분 ${Math.floor(
      (remainingTime % 60000) / 1000
    )}초`;
  }

  // 팀원의 현재 위치를 반환
  async getLocationCrew({ boardId, userId }) {
    // 팀원의 출석기록을 가져온다 (닉네임은 바뀔 수 있으므로 userId로 찾는다)
    const memberAttendance = await this.attendanceRepository.findOne({
      where: {
        userId,
        board: { id: boardId },
      },
      order: {
        attendedAt: "DESC",
      },
    });

    // 출석기록이 없으면 에러를 반환
    if (!memberAttendance) {
      throw new Error("출석 기록이 없습니다.");
    }

    // 위치를 반환
    return `${memberAttendance.latitude},${memberAttendance.longitude}`;
  }

  // 팀장의 현재 위치를 반환
  async getLocationLeader({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });

    // 팀장의 최근 출석기록을 가져온다
    const leaderAttendance = await this.getLeaderLatestAttendance({ board });
    if (!leaderAttendance) {
      throw new Error("출석 기록이 없습니다.");
    }

    // 위치를 반환
    return `${leaderAttendance.latitude},${leaderAttendance.longitude}`;
  }

  // 보드의 출석부를 반환
  async getAttendanceList({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });
    const attendanceList = await this.attendanceRepository.find({
      where: {
        board: { id: boardId },
      },
      order: {
        attendedAt: "DESC",
      },
    });

    // 당일 출석한 유저의 출석기록을 반환
    return attendanceList.filter((attendance) => {
      const today = new Date(new Intl.DateTimeFormat("kr").format());
      return (
        attendance.attendedAt.getFullYear() === today.getFullYear() &&
        attendance.attendedAt.getMonth() === today.getMonth() &&
        attendance.attendedAt.getDate() === today.getDate()
      );
    });
  }
}
