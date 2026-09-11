import type { CycleShiftType, SchedulePreset, ShiftTime } from './types';

export const PRESET_CYCLES: Record<Exclude<SchedulePreset, 'custom'>, CycleShiftType[]> = {
  '2x2': ['day', 'day', 'off', 'off'],
  '3x3': ['day', 'day', 'day', 'off', 'off', 'off'],
  '5x2': ['day', 'day', 'day', 'day', 'day', 'off', 'off'],
  '1x3': ['full_day', 'off', 'off', 'off'],
  'day-night-48': ['day', 'night', 'off', 'off'],
};

export const DEFAULT_SHIFT_TIMES: { day: ShiftTime; night: ShiftTime; fullDay: ShiftTime } = {
  day: { start: '08:00', end: '20:00' },
  night: { start: '20:00', end: '08:00' },
  fullDay: { start: '08:00', end: '08:00' },
};

export const PRESET_LABELS: Record<SchedulePreset, string> = {
  '2x2': '2 / 2',
  '3x3': '3 / 3',
  '5x2': '5 / 2',
  '1x3': 'Сутки / трое',
  'day-night-48': 'День · Ночь · 2 выходных',
  custom: 'Свой цикл',
};
