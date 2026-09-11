import { addDays, daysBetween } from './date';
import type {
  CycleShiftType,
  ResolvedDay,
  ScheduleConfigV1,
  ShiftTime,
  ShiftType,
} from './types';

export const WORK_SHIFT_TYPES: ShiftType[] = ['day', 'night', 'full_day'];

export function positiveModulo(value: number, divisor: number): number {
  if (!Number.isInteger(divisor) || divisor <= 0) {
    throw new Error('Divisor must be a positive integer');
  }

  return ((value % divisor) + divisor) % divisor;
}

export function validateCycle(cycle: CycleShiftType[]): void {
  if (cycle.length < 1 || cycle.length > 31) {
    throw new Error('Cycle length must be between 1 and 31');
  }
}

export function getBaseShift(config: ScheduleConfigV1, date: string): CycleShiftType {
  validateCycle(config.cycle);
  const offset = daysBetween(config.anchorDate, date);
  return config.cycle[positiveModulo(offset, config.cycle.length)];
}

export function resolveDay(config: ScheduleConfigV1, date: string): ResolvedDay {
  const baseShift = getBaseShift(config, date);
  const override = config.overrides[date];

  return {
    date,
    baseShift,
    shift: override ?? baseShift,
    isOverride: override !== undefined,
  };
}

export function withOverride(
  config: ScheduleConfigV1,
  date: string,
  shift: ShiftType,
): ScheduleConfigV1 {
  return {
    ...config,
    overrides: {
      ...config.overrides,
      [date]: shift,
    },
  };
}

export function withoutOverride(config: ScheduleConfigV1, date: string): ScheduleConfigV1 {
  if (!(date in config.overrides)) {
    return config;
  }

  const overrides = { ...config.overrides };
  delete overrides[date];

  return {
    ...config,
    overrides,
  };
}

function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid time: ${value}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time: ${value}`);
  }

  return hours * 60 + minutes;
}

export function shiftDurationHours(time: ShiftTime, fullDay = false): number {
  const start = timeToMinutes(time.start);
  const end = timeToMinutes(time.end);

  if (start === end) {
    return fullDay ? 24 : 0;
  }

  const minutes = end > start ? end - start : 24 * 60 - start + end;
  return minutes / 60;
}

export function resolvedShiftHours(config: ScheduleConfigV1, shift: ShiftType): number {
  switch (shift) {
    case 'day':
      return shiftDurationHours(config.times.day);
    case 'night':
      return shiftDurationHours(config.times.night);
    case 'full_day':
      return shiftDurationHours(config.times.fullDay, true);
    default:
      return 0;
  }
}

export function isWorkShift(shift: ShiftType): boolean {
  return WORK_SHIFT_TYPES.includes(shift);
}

export interface NextShiftResult {
  date: string;
  shift: ShiftType;
  daysAway: number;
}

export function findNextWorkShift(
  config: ScheduleConfigV1,
  fromDate: string,
  maxDays = 366,
): NextShiftResult | null {
  for (let daysAway = 1; daysAway <= maxDays; daysAway += 1) {
    const date = addDays(fromDate, daysAway);
    const shift = resolveDay(config, date).shift;

    if (isWorkShift(shift)) {
      return { date, shift, daysAway };
    }
  }

  return null;
}
