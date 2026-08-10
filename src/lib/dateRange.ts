function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** 오늘 날짜 기준 해당 월 1일 ~ 말일 (YYYY-MM-DD) */
export function defaultMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const from = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { from, to };
}

/** from~to 기간이 걸치는 모든 월의 첫날(YYYY-MM-01) 목록 */
export function monthsInRange(from: string, to: string): string[] {
  const start = new Date(from);
  const end = new Date(to);
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-01`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}
