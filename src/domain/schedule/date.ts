const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function parseDateKey(value: string): DateParts {
  const match = DATE_RE.exec(value);
  if (!match) {
    throw new Error(`Invalid date key: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return { year, month, day };
}

export function formatDateKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function dateKeyToDayNumber(value: string): number {
  const { year, month, day } = parseDateKey(value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function dayNumberToDateKey(dayNumber: number): string {
  const date = new Date(dayNumber * 86_400_000);
  return formatDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addDays(value: string, days: number): string {
  return dayNumberToDateKey(dateKeyToDayNumber(value) + days);
}

export function daysBetween(from: string, to: string): number {
  return dateKeyToDayNumber(to) - dateKeyToDayNumber(from);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function weekdayMondayFirst(value: string): number {
  const { year, month, day } = parseDateKey(value);
  const sundayFirst = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

export function todayDateKey(now = new Date()): string {
  return formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
