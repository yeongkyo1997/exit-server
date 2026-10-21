import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from "cache-manager";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { DataSource, Repository } from "typeorm";
import { Attendance } from "./entities/attendance.entity";
import * as geolib from "geolib";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { AuthUser } from "src/commons/type/context";
import { toLocalDate } from "src/commons/utils/date";

// 리더의 출석시간을 기준으로 10분 이후의 시간
const attendanceWindowEnd = (attendedAt: Date) =>
  toLocalDate(attendedAt.getTime() + 10 * 60000);

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

  async checkIn({
    user,
    latitude,
    longitude,
    boardId,
  }: {
    user: AuthUser;
    latitude: number;
    longitude: number;
    boardId: string;
  }) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    const validate = await this.effectiveUser({ user });
    if (!validate) {
      throw new Error("유효하지 않은 유저입니다.");
    }

    // 리더가 아니고(팀원일 경우) 리더가 캐시에 없으면 error
    if (board.leader !== user.id) {
      // 이미 출석한 유저인지 확인
      // 버그 유지: await하지 않아 Promise를 검사하므로 항상 통과한다
      if (!this.checkAttendance({ user })) {
        throw new Error("이미 출석한 유저입니다.");
      }
      // 리더를 레디스에서 찾기
      const isLeader = await this.cacheManager.get(board.leader);
      if (!isLeader) {
        throw new Error("팀장이 출석을 활성화하지 않았습니다.");
      }

      // 출석 체크
      return this.checkLocation({ user, latitude, longitude, board });
    }

    // 리더인 경우
    // 이미 출석한 경우
    const isUser = await this.cacheManager.get(user.id);
    if (isUser) throw new Error("이미 출석이 활성화되었습니다.");

    // 레디스에 위도 경도를 저장하고 ttl을 10분으로 설정
    await this.cacheManager.set(user.id, `${latitude},${longitude}`, {
      ttl: 600,
    });
    await this.checkLocation({ user, latitude, longitude, board });
    return true;
  }

  async checkLocation({ user, latitude, longitude, board }) {
    const leader = board.leader;

    // 리더와 현재 유저의 위치를 비교한다
    const leaderLocation = await this.cacheManager.get(leader);
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
      // 이미 출석한 유저인지 확인
      // 버그 유지: get()을 await하지 않고 객체를 키로 넘긴다
      if (user === this.cacheManager.get(user))
        throw new Error("이미 출석한 유저입니다.");

      // 출석 테이블에 저장
      await this.attendanceRepository.save({
        // 현재 시간 저장
        nickname: user.nickname,
        userId: user.id,
        attendedAt: toLocalDate(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        board,
      });

      return true;
    }
  }

  async effectiveUser({ user }) {
    const currentUser = await this.userBoardRepository.findOne({
      where: {
        user: user,
        isAccepted: true,
      },
    });

    return !!currentUser;
  }

  // leader의 최근 출석기록을 가져온다
  private async findLeaderLatestAttendance(boardId: string) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    const leader = await this.userRepository.findOne({
      where: { id: board.leader },
    });

    return this.attendanceRepository.findOne({
      where: { nickname: leader.nickname },
      order: { attendedAt: "DESC" },
    });
  }

  async getAttendanceCount({ boardId }) {
    const leaderAttendance = await this.findLeaderLatestAttendance(boardId);

    // leader의 출석기록을 기준으로 10분 이내에 출석한 유저들의 수를 가져온다
    const attendanceCount = await this.dataSource.manager
      .createQueryBuilder(Attendance, "attendance")
      .where(
        "attendance.attendedAt >= :attendedAt AND attendance.attendedAt <= :finish",
        {
          attendedAt: leaderAttendance.attendedAt,
          finish: attendanceWindowEnd(leaderAttendance.attendedAt),
        }
      )
      .getCount();

    return attendanceCount;
  }

  async getAllAttendancePercent({ board }) {
    // 승인된 유저들의 수와 현재까지 출석한 횟수를 가져온다
    // board.id를 가장 먼저 읽어야 한다 (board가 없을 때 같은 TypeError 유지)
    const [userCount, attendanceCount] = await Promise.all([
      this.userBoardRepository.count({
        where: { board: { id: board.id } },
      }),
      this.attendanceRepository.count({
        where: { board: { id: board.id } },
      }),
    ]);
    // 일주일에 몇 번 출석하는 보드인지 가져온다.
    const frequency = board.frequency;

    // 프로젝트 시작으로부터 몇 주차인지 가져온다.
    const weekCount = Math.floor(
      (toLocalDate().getTime() - board.startAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    // 출석해야 하는 총 횟수를 계산한다.
    const totalAttendanceCount = weekCount * frequency * userCount;

    if (totalAttendanceCount === 0) {
      return 0;
    }

    // 출석률을 계산한다.
    const attendancePercent = Math.floor(
      (attendanceCount / totalAttendanceCount) * 100
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

  // 이미 출석한 유저인지 확인
  async checkAttendance({ user }) {
    // 유저가 참석하고 있는 보드의 아이디를 가져온다
    const board = await this.userBoardRepository.findOne({
      where: {
        user,
        isAccepted: true,
      },
      relations: ["board"],
    });

    const leaderAttendance = await this.attendanceRepository.findOne({
      where: {
        userId: board.board.leader,
      },
      order: {
        attendedAt: "DESC",
      },
    });

    // leader의 출석기록을 기준으로 10분 이내에 출석한 유저인지 확인
    const attendance = await this.dataSource.manager
      .createQueryBuilder(Attendance, "attendance")
      .where(
        "attendance.attendedAt >= :attendedAt AND attendance.attendedAt <= :finish",
        {
          attendedAt: leaderAttendance.attendedAt,
          finish: attendanceWindowEnd(leaderAttendance.attendedAt),
        }
      )
      .andWhere("attendance.nickname = :nickname", {
        nickname: user.nickname,
      })
      .getOne();

    if (!attendance) {
      return true;
    }
    return false;
  }

  // board에 남은 출석 가능한 시간을 반환
  async getRemainingTime({ boardId }) {
    const leaderAttendance = await this.findLeaderLatestAttendance(boardId);

    const finish = attendanceWindowEnd(leaderAttendance.attendedAt);
    // 현재 시간과 10분 이후의 시간을 비교하여 남은 시간을 반환
    const remainingTime = finish.getTime() - toLocalDate().getTime();
    if (remainingTime < 0) {
      throw new Error("출석 가능한 시간이 아닙니다.");
    }

    return `${Math.floor(remainingTime / 60000)}분 ${Math.floor(
      (remainingTime % 60000) / 1000
    )}초`;
  }

  // 팀원의 현재 위치를 반환
  async getLocationCrew({ boardId, userId }) {
    const member = await this.userRepository.findOne({
      where: { id: userId },
    });

    // 팀원의 출석기록을 가져온다
    const memberAttendance = await this.attendanceRepository.findOne({
      where: {
        nickname: member.nickname,
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
    const leaderAttendance = await this.findLeaderLatestAttendance(boardId);

    // 위치를 반환
    return `${leaderAttendance.latitude},${leaderAttendance.longitude}`;
  }

  // 보드의 출석부를 반환
  async getAttendanceList({ boardId }) {
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
      const today = toLocalDate();
      return (
        attendance.attendedAt.getFullYear() === today.getFullYear() &&
        attendance.attendedAt.getMonth() === today.getMonth() &&
        attendance.attendedAt.getDate() === today.getDate()
      );
    });
  }
}
