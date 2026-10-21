// 날짜만 남기고 시각은 버린 Date (자정). 인자가 없으면 지금 시각 기준.
export const toLocalDate = (date?: number | Date) =>
  new Date(new Intl.DateTimeFormat("kr").format(date));
