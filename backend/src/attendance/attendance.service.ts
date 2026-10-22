import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from "cache-manager";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { Between, DataSource, EntityManager, Repository } from "typeorm";
import { Attendance } from "./entities/attendance.entity";
import * as geolib from "geolib";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { AuthUser } from "src/commons/type/context";
import { serviceDayRange, toLocalDate } from "src/commons/utils/date";
import { leaderLocationKey } from "src/commons/cache-keys";
import {
  ATTENDANCE_RADIUS_METERS,
  ATTENDANCE_WINDOW_SECONDS,
} from "src/commons/constants";

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

// 리더의 출석시간을 기준으로 출석 가능 시간(ATTENDANCE_WINDOW_SECONDS) 이후의 시간
const attendanceWindowEnd = (attendedAt: Date) =>
  new Date(attendedAt.getTime() + ATTENDANCE_WINDOW_SECONDS * 1000);

// where에 빈 값이 들어가면 TypeORM 0.3.9가 조건을 버려 아무 행이나 매칭되므로 조회 전에 거른다
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

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
    // 이 보드의 팀장이거나 승인된 팀원만 출석할 수 있다 (없는 보드도 같은 에러)
    const board = await this.findBoardOfMember({ boardId, userId: user?.id });
    if (!board) throw new ForbiddenException("유효하지 않은 유저입니다.");

    return this.dataSource.transaction(async (manager) => {
      // 같은 유저의 출석 요청은 하나씩 처리한다 (중복 확인과 저장 사이에 같은 유저의 다른 요청이 끼지 않게)
      const lockedUser = await manager.findOne(User, {
        where: { id: user.id },
        lock: { mode: "pessimistic_write" },
      });
      if (!lockedUser)
        throw new ForbiddenException("유효하지 않은 유저입니다.");

      // 리더가 아니고(팀원일 경우) 리더가 캐시에 없으면 error
      if (board.leader !== user.id) {
        // 이미 출석한 유저인지 확인 (이 보드에서)
        if (await this.hasAttended(manager, { board, userId: user.id })) {
          throw new Error("이미 출석한 유저입니다.");
        }
        // 리더를 레디스에서 찾기
        const isLeader = await this.getLeaderLocation(board.leader);
        if (!isLeader) {
          throw new Error("팀장이 출석을 활성화하지 않았습니다.");
        }

        // 출석 체크
        return this.checkLocation({
          manager,
          user,
          latitude,
          longitude,
          board,
        });
      }

      // 리더인 경우
      // 이미 출석한 경우
      const isUser = await this.getLeaderLocation(user.id);
      if (isUser) throw new Error("이미 출석이 활성화되었습니다.");

      // 레디스에 위도 경도를 저장하고 ttl을 출석 가능 시간으로 설정
      await this.cacheManager.set(
        leaderLocationKey(user.id),
        `${latitude},${longitude}`,
        { ttl: ATTENDANCE_WINDOW_SECONDS }
      );
      await this.checkLocation({ manager, user, latitude, longitude, board });
      return true;
    });
  }

  async checkLocation({
    manager,
    user,
    latitude,
    longitude,
    board,
  }: {
    manager: EntityManager;
    user: AuthUser;
    latitude: number;
    longitude: number;
    board: Board;
  }) {
    const leader = board.leader;

    // 리더와 현재 유저의 위치를 비교한다
    const leaderLocation = await this.getLeaderLocation(leader);
    if (!leaderLocation) {
      throw new Error("팀장이 출석을 활성화하지 않았습니다.");
    }
    const userLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    // 리더의 현재 위치를 start로 설정
    const start = {
      latitude: Number(leaderLocation.split(",")[0]),
      longitude: Number(leaderLocation.split(",")[1]),
    };

    // 두 위치의 거리를 계산
    const distance = geolib.isPointWithinRadius(
      start,
      userLocation,
      ATTENDANCE_RADIUS_METERS
    );

    // 출석이 가능한 거리인지 확인
    if (!distance) {
      throw new Error("출석이 불가능한 거리입니다.");
    } else {
      // 출석 테이블에 저장
      await manager.save(Attendance, {
        // 현재 시간 저장
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

  // 팀장이 활성화한 출석 위치("위도,경도"). 없거나 문자열이 아니면 null (= 활성화되지 않음)
  private async getLeaderLocation(leaderUserId: string) {
    if (!isNonEmptyString(leaderUserId)) return null;
    const location = await this.cacheManager.get(
      leaderLocationKey(leaderUserId)
    );
    return isNonEmptyString(location) ? location : null;
  }

  // 이 보드의 팀장(board.leader)이거나 승인된 팀원이면 보드를, 아니면(없는 보드 포함) null을 돌려준다
  private async findBoardOfMember({
    boardId,
    userId,
  }: {
    boardId: string;
    userId: string;
  }) {
    if (!isNonEmptyString(boardId) || !isNonEmptyString(userId)) return null;

    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });
    if (!board) return null;
    if (board.leader === userId) return board;

    const membership = await this.userBoardRepository.findOne({
      where: {
        user: { id: userId },
        board: { id: boardId },
        isAccepted: true,
      },
    });
    return membership ? board : null;
  }

  // 출석 위치는 해당 프로젝트의 팀장이나 승인된 팀원만 볼 수 있다 (없는 보드와 비멤버는 같은 에러)
  async assertBoardMember({
    boardId,
    userId,
  }: {
    boardId: string;
    userId: string;
  }) {
    const board = await this.findBoardOfMember({ boardId, userId });
    if (!board) {
      throw new ForbiddenException("프로젝트 참여자만 볼 수 있습니다.");
    }
    return board;
  }

  // 이 보드에서 leader의 최근 출석기록을 가져온다 (닉네임은 중복될 수 있으므로 user id로 찾는다)
  private async findLeaderLatestAttendance(boardId: string) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    return this.attendanceRepository.findOne({
      where: { userId: board.leader, board: { id: board.id } },
      order: { attendedAt: "DESC" },
    });
  }

  async getAttendanceCount({ boardId }) {
    const leaderAttendance = await this.findLeaderLatestAttendance(boardId);

    // 이 보드에서 leader의 출석기록을 기준으로 출석 가능 시간 안에 출석한 유저들의 수를 가져온다
    const attendanceCount = await this.dataSource.manager
      .createQueryBuilder(Attendance, "attendance")
      .where("attendance.boardId = :boardId", { boardId })
      .andWhere(
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
      (toLocalDate().getTime() - board.startAt.getTime()) / MS_PER_WEEK
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

  // 이미 출석한 유저인지 확인: 이 보드에 오늘(SERVICE_TIMEZONE 기준) 출석한 기록이 있는지 본다
  // (팀장의 최근 출석은 다른 날일 수 있어 기준으로 쓰지 않는다)
  // (checkIn의 트랜잭션 안에서 같은 유저 행을 잠근 뒤 호출한다)
  private async hasAttended(
    manager: EntityManager,
    { board, userId }: { board: Board; userId: string }
  ) {
    const { start, end } = serviceDayRange();
    const count = await manager.count(Attendance, {
      where: {
        userId,
        board: { id: board.id },
        attendedAt: Between(start, end),
      },
    });

    return count > 0;
  }

  // board에 남은 출석 가능한 시간을 반환
  async getRemainingTime({ boardId }) {
    const leaderAttendance = await this.findLeaderLatestAttendance(boardId);

    const finish = attendanceWindowEnd(leaderAttendance.attendedAt);
    // 현재 시간과 출석 마감 시간을 비교하여 남은 시간을 반환
    const remainingTime = finish.getTime() - Date.now();
    if (remainingTime < 0) {
      throw new Error("출석 가능한 시간이 아닙니다.");
    }

    return `${Math.floor(remainingTime / 60000)}분 ${Math.floor(
      (remainingTime % 60000) / 1000
    )}초`;
  }

  // 팀원의 현재 위치를 반환 (닉네임은 중복될 수 있으므로 user id와 보드로 찾는다)
  async getLocationCrew({
    boardId,
    userId,
  }: {
    boardId: string;
    userId: string;
  }) {
    // 팀원의 출석기록을 가져온다
    const memberAttendance =
      isNonEmptyString(boardId) && isNonEmptyString(userId)
        ? await this.attendanceRepository.findOne({
            where: {
              userId,
              board: { id: boardId },
            },
            order: {
              attendedAt: "DESC",
            },
          })
        : null;

    // 출석기록이 없으면 에러를 반환
    if (!memberAttendance) {
      throw new Error("출석 기록이 없습니다.");
    }

    // 위치를 반환
    return `${memberAttendance.latitude},${memberAttendance.longitude}`;
  }

  // 팀장의 현재 위치를 반환 (이 보드에서 팀장이 출석한 기록, user id 기준)
  async getLocationLeader({ boardId }: { boardId: string }) {
    const board = isNonEmptyString(boardId)
      ? await this.boardRepository.findOne({ where: { id: boardId } })
      : null;

    const leaderAttendance = isNonEmptyString(board?.leader)
      ? await this.attendanceRepository.findOne({
          where: {
            userId: board.leader,
            board: { id: board.id },
          },
          order: {
            attendedAt: "DESC",
          },
        })
      : null;

    // 출석기록이 없으면 에러를 반환
    if (!leaderAttendance) {
      throw new Error("출석 기록이 없습니다.");
    }

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

    // 당일(SERVICE_TIMEZONE 기준) 출석한 유저의 출석기록을 반환
    const { start, end } = serviceDayRange();
    return attendanceList.filter(
      (attendance) =>
        attendance.attendedAt >= start && attendance.attendedAt < end
    );
  }
}
