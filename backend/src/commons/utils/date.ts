import { SERVICE_TIMEZONE } from "src/commons/constants";

const serviceDateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: SERVICE_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

// SERVICE_TIMEZONE 기준 연·월·일·시·분·초
const serviceDateTimeParts = (date: number | Date) => {
  const parts = serviceDateTimeFormat.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type).value);
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second"),
  };
};

// SERVICE_TIMEZONE의 해당 날짜 0시가 되는 실제 시각
const serviceMidnight = (year: number, month: number, day: number) => {
  const guess = Date.UTC(year, month - 1, day);
  const p = serviceDateTimeParts(guess);
  const offset =
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - guess;
  return new Date(guess - offset);
};

// 날짜만 남기고 시각은 버린 Date (자정). 인자가 없으면 지금 시각 기준.
// 날짜는 서버 TZ가 아니라 SERVICE_TIMEZONE 기준으로 고르고, 반환값은 기존처럼 서버 로컬 자정이다
export const toLocalDate = (date?: number | Date) => {
  const { year, month, day } = serviceDateTimeParts(date ?? Date.now());
  return new Date(year, month - 1, day);
};

// date(기본: 지금)가 속한 SERVICE_TIMEZONE 하루의 [start, end) 실제 시각 범위
export const serviceDayRange = (date?: number | Date) => {
  const { year, month, day } = serviceDateTimeParts(date ?? Date.now());
  return {
    start: serviceMidnight(year, month, day),
    end: serviceMidnight(year, month, day + 1),
  };
};
