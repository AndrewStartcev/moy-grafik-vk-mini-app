import vkBridge from '@vkontakte/vk-bridge';
import type {
  CycleShiftType,
  ScheduleConfigV1,
  SchedulePreset,
  ShiftType,
} from '../domain/schedule/types';

const STORAGE_KEY = 'moy_grafik_schedule';
const VK_STORAGE_TIMEOUT_MS = 1200;

const CYCLE_SHIFT_TYPES: CycleShiftType[] = ['day', 'night', 'full_day', 'off'];
const SHIFT_TYPES: ShiftType[] = ['day', 'night', 'full_day', 'off', 'vacation', 'sick'];
const SCHEDULE_PRESETS: SchedulePreset[] = ['2x2', '3x3', '5x2', '1x3', 'day-night-48', 'custom'];

function isScheduleConfigV1(value: unknown): value is ScheduleConfigV1 {
  if (!value || typeof value !== 'object') return false;

  const config = value as Record<string, unknown>;
  const cycle = config.cycle;
  const times = config.times;
  const overrides = config.overrides;

  if (
    config.version !== 1 ||
    typeof config.anchorDate !== 'string' ||
    typeof config.preset !== 'string' ||
    !SCHEDULE_PRESETS.includes(config.preset as SchedulePreset) ||
    !Array.isArray(cycle) ||
    cycle.length === 0 ||
    cycle.length > 31 ||
    !cycle.every(
      (item) => typeof item === 'string' && CYCLE_SHIFT_TYPES.includes(item as CycleShiftType),
    ) ||
    !times ||
    typeof times !== 'object' ||
    !overrides ||
    typeof overrides !== 'object' ||
    Array.isArray(overrides)
  ) {
    return false;
  }

  const typedTimes = times as Record<string, unknown>;
  const day = typedTimes.day;
  const night = typedTimes.night;
  const fullDay = typedTimes.fullDay;

  const isShiftTime = (shiftTime: unknown): boolean => {
    if (!shiftTime || typeof shiftTime !== 'object') return false;
    const value = shiftTime as Record<string, unknown>;
    return typeof value.start === 'string' && typeof value.end === 'string';
  };

  if (!isShiftTime(day) || !isShiftTime(night) || !isShiftTime(fullDay)) {
    return false;
  }

  return Object.entries(overrides as Record<string, unknown>).every(
    ([date, shift]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      typeof shift === 'string' &&
      SHIFT_TYPES.includes(shift as ShiftType),
  );
}

function parseSchedule(raw: string | null): ScheduleConfigV1 | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isScheduleConfigV1(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

async function readFromVk(): Promise<string | null> {
  const response = await withTimeout(
    vkBridge.send('VKWebAppStorageGet', { keys: [STORAGE_KEY] }),
    null,
    VK_STORAGE_TIMEOUT_MS,
  );

  if (!response) return null;
  return response.keys?.find((item) => item.key === STORAGE_KEY)?.value || null;
}

async function writeToVk(value: string): Promise<void> {
  await withTimeout(
    vkBridge.send('VKWebAppStorageSet', { key: STORAGE_KEY, value }).then(() => undefined),
    undefined,
    VK_STORAGE_TIMEOUT_MS,
  );
}

function readLocal(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLocal(value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Product remains usable in-memory if browser storage is unavailable.
  }
}

export const scheduleStorage = {
  async load(): Promise<ScheduleConfigV1 | null> {
    // A valid local copy must make startup instant and independent of VK Bridge.
    const local = parseSchedule(readLocal());
    if (local) return local;

    try {
      const fromVk = parseSchedule(await readFromVk());
      if (fromVk) {
        writeLocal(JSON.stringify(fromVk));
        return fromVk;
      }
    } catch {
      // Browser/local fallback below.
    }

    return null;
  },

  async save(config: ScheduleConfigV1): Promise<void> {
    const serialized = JSON.stringify(config);
    writeLocal(serialized);

    try {
      await writeToVk(serialized);
    } catch {
      // localStorage is the fallback; VK failure must not break the calendar.
    }
  },

  async clear(): Promise<void> {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore local storage cleanup failure.
    }

    try {
      await writeToVk('');
    } catch {
      // Ignore VK storage cleanup failure.
    }
  },
};
