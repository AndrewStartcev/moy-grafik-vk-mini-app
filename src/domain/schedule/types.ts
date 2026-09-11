export type ShiftType =
  | 'day'
  | 'night'
  | 'full_day'
  | 'off'
  | 'vacation'
  | 'sick';

export type CycleShiftType = Exclude<ShiftType, 'vacation' | 'sick'>;

export type SchedulePreset =
  | '2x2'
  | '3x3'
  | '5x2'
  | '1x3'
  | 'day-night-48'
  | 'custom';

export interface ShiftTime {
  start: string;
  end: string;
}

export interface ScheduleConfigV1 {
  version: 1;
  preset: SchedulePreset;
  cycle: CycleShiftType[];
  anchorDate: string;
  times: {
    day: ShiftTime;
    night: ShiftTime;
    fullDay: ShiftTime;
  };
  overrides: Record<string, ShiftType>;
}

export interface MonthStatistics {
  workShiftCount: number;
  totalWorkHours: number;
  offCount: number;
  dayCount: number;
  nightCount: number;
  fullDayCount: number;
  vacationCount: number;
  sickCount: number;
}

export interface ResolvedDay {
  date: string;
  baseShift: CycleShiftType;
  shift: ShiftType;
  isOverride: boolean;
}
