import { DEFAULT_SHIFT_TIMES, PRESET_CYCLES } from './presets';
import type { CycleShiftType, ScheduleConfigV1, SchedulePreset } from './types';

export function createScheduleConfig(params: {
  preset: SchedulePreset;
  anchorDate: string;
  customCycle?: CycleShiftType[];
}): ScheduleConfigV1 {
  const cycle =
    params.preset === 'custom'
      ? params.customCycle
      : PRESET_CYCLES[params.preset];

  if (!cycle || cycle.length < 1 || cycle.length > 31) {
    throw new Error('Invalid schedule cycle');
  }

  return {
    version: 1,
    preset: params.preset,
    cycle: [...cycle],
    anchorDate: params.anchorDate,
    times: {
      day: { ...DEFAULT_SHIFT_TIMES.day },
      night: { ...DEFAULT_SHIFT_TIMES.night },
      fullDay: { ...DEFAULT_SHIFT_TIMES.fullDay },
    },
    overrides: {},
  };
}
