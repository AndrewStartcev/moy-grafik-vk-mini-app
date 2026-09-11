import { describe, expect, it } from 'vitest';
import { DEFAULT_SHIFT_TIMES, PRESET_CYCLES } from './presets';
import { withOverride } from './engine';
import { calculateMonthStatistics } from './statistics';
import type { ScheduleConfigV1 } from './types';

function config(): ScheduleConfigV1 {
  return {
    version: 1,
    preset: '2x2',
    cycle: PRESET_CYCLES['2x2'],
    anchorDate: '2026-09-01',
    times: DEFAULT_SHIFT_TIMES,
    overrides: {},
  };
}

describe('calculateMonthStatistics', () => {
  it('calculates a full month for 2/2', () => {
    const stats = calculateMonthStatistics(config(), 2026, 9);

    expect(stats.workShiftCount).toBe(16);
    expect(stats.offCount).toBe(14);
    expect(stats.totalWorkHours).toBe(192);
    expect(stats.dayCount).toBe(16);
  });

  it('uses overrides in statistics', () => {
    const changed = withOverride(config(), '2026-09-01', 'vacation');
    const stats = calculateMonthStatistics(changed, 2026, 9);

    expect(stats.workShiftCount).toBe(15);
    expect(stats.totalWorkHours).toBe(180);
    expect(stats.vacationCount).toBe(1);
  });
});
