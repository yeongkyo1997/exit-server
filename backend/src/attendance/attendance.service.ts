import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from "cache-manager";
import { UserBoard } from "src/userBoard/entities/userBoard.entity";
import { DataSource, Repository } from "typeorm";
import { Attendance } from "./entities/attendance.entity";
import * as geolib from "geolib";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";

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
      if (user === this.cacheManager.get(user))
        throw new Error("이미 출석한 유저입니다.");

      // 출석 테이블에 저장
      await this.attendanceRepository.save({
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

  async effectiveUser({ user }) {
    const currentUser = await this.userBoardRepository.findOne({
      where: {
        user: user,
        isAccepted: true,
      },
      relations: ["user", "board"],
    });

    if (!currentUser || !currentUser.isAccepted) {
      return false;
    }
    return true;
  }

  async getAttendanceCount({ boardId }) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });

    const leader = await this.userRepository.findOne({
      where: {
        id: board.leader,
      },
    });

    // leader의 최근 출석기록을 가져온다
    const leaderAttendance = await this.attendanceRepository.findOne({
      where: {
        nickname: leader.nickname,
      },
      order: {
        attendedAt: "DESC",
      },
    });

    // leader의 출석기록을 기준으로 10분 이내에 출석한 유저들의 수를 가져온다
    const attendanceCount = await this.dataSource.manager
      .createQueryBuilder(Attendance, "attendance")
      .where(
        "attendance.attendedAt >= :attendedAt AND attendance.attendedAt <= :finish",
        {
          attendedAt: leaderAttendance.attendedAt,
          finish: new Date(leaderAttendance.attendedAt.getTime() + 10 * 60000),
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
      },
    });
    // 일주일에 몇 번 출석하는 보드인지 가져온다.
    const frequency = board.frequency;

    // 프로젝트 시작으로부터 몇 주차인지 가져온다.
    const weekCount = Math.floor(
      (new Date().getTime() - board.startAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    // 출석해야 하는 총 횟수를 계산한다.
    const totalAttendanceCount = weekCount * frequency * userCount;
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
          finish: new Date(leaderAttendance.attendedAt.getTime() + 10 * 60000),
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
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });

    const leader = await this.userRepository.findOne({
      where: {
        id: board.leader,
      },
    });

    // leader의 최근 출석기록을 가져온다
    const leaderAttendance = await this.attendanceRepository.findOne({
      where: {
        nickname: leader.nickname,
      },
      order: {
        attendedAt: "DESC",
      },
    });

    // leader의 출석시간을 기준으로 10분 이후의 시간
    const finish = new Date(leaderAttendance.attendedAt.getTime() + 10 * 60000);
    // 현재 시간과 10분 이후의 시간을 비교하여 남은 시간을 반환
    const remainingTime = finish.getTime() - new Date().getTime();
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
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
      },
    });

    const leader = await this.userRepository.findOne({
      where: { id: board.leader },
    });

    // 팀장의 최근 출석기록을 가져온다
    const leaderAttendance = await this.attendanceRepository.findOne({
      where: {
        nickname: leader.nickname,
      },
      order: {
        attendedAt: "DESC",
      },
    });

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
        board,
      },
      order: {
        attendedAt: "DESC",
      },
    });

    // 당일 출석한 유저의 출석기록을 반환
    return attendanceList.filter((attendance) => {
      const today = new Date();
      return (
        attendance.attendedAt.getFullYear() === today.getFullYear() &&
        attendance.attendedAt.getMonth() === today.getMonth() &&
        attendance.attendedAt.getDate() === today.getDate()
      );
    });
  }
}
