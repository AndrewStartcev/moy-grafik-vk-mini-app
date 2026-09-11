import { describe, expect, it } from 'vitest';
import { DEFAULT_SHIFT_TIMES, PRESET_CYCLES } from './presets';
import {
  findNextWorkShift,
  getBaseShift,
  positiveModulo,
  resolveDay,
  shiftDurationHours,
  withOverride,
  withoutOverride,
} from './engine';
import { addDays, daysBetween } from './date';
import type { ScheduleConfigV1 } from './types';

function config(overrides: ScheduleConfigV1['overrides'] = {}): ScheduleConfigV1 {
  return {
    version: 1,
    preset: '2x2',
    cycle: PRESET_CYCLES['2x2'],
    anchorDate: '2026-09-11',
    times: DEFAULT_SHIFT_TIMES,
    overrides,
  };
}

describe('positiveModulo', () => {
  it('normalizes negative values', () => {
    expect(positiveModulo(-1, 4)).toBe(3);
    expect(positiveModulo(-4, 4)).toBe(0);
    expect(positiveModulo(-5, 4)).toBe(3);
  });
});

describe('calendar date helpers', () => {
  it('crosses leap day without timezone drift', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('crosses year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('schedule cycle', () => {
  it('resolves dates after anchor', () => {
    const schedule = config();
    expect(getBaseShift(schedule, '2026-09-11')).toBe('day');
    expect(getBaseShift(schedule, '2026-09-12')).toBe('day');
    expect(getBaseShift(schedule, '2026-09-13')).toBe('off');
    expect(getBaseShift(schedule, '2026-09-14')).toBe('off');
    expect(getBaseShift(schedule, '2026-09-15')).toBe('day');
  });

  it('resolves dates before anchor', () => {
    const schedule = config();
    expect(getBaseShift(schedule, '2026-09-10')).toBe('off');
    expect(getBaseShift(schedule, '2026-09-09')).toBe('off');
    expect(getBaseShift(schedule, '2026-09-08')).toBe('day');
  });
});

describe('overrides', () => {
  it('applies and removes a single date override', () => {
    const schedule = config();
    const changed = withOverride(schedule, '2026-09-13', 'vacation');

    expect(resolveDay(changed, '2026-09-13')).toMatchObject({
      baseShift: 'off',
      shift: 'vacation',
      isOverride: true,
    });

    const restored = withoutOverride(changed, '2026-09-13');
    expect(resolveDay(restored, '2026-09-13')).toMatchObject({
      shift: 'off',
      isOverride: false,
    });
  });
});

describe('shift duration', () => {
  it('handles normal and overnight shifts', () => {
    expect(shiftDurationHours({ start: '08:00', end: '20:00' })).toBe(12);
    expect(shiftDurationHours({ start: '20:00', end: '08:00' })).toBe(12);
    expect(shiftDurationHours({ start: '08:00', end: '08:00' }, true)).toBe(24);
  });
});

describe('next shift', () => {
  it('finds next working day and respects overrides', () => {
    let schedule = config();
    schedule = withOverride(schedule, '2026-09-12', 'off');

    expect(findNextWorkShift(schedule, '2026-09-11')).toEqual({
      date: '2026-09-15',
      shift: 'day',
      daysAway: 4,
    });
  });
});
