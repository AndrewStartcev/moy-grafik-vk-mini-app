import vkBridge from '@vkontakte/vk-bridge';
import type { ScheduleConfigV1, ShiftType } from '../domain/schedule/types';

const STORAGE_KEY = 'moy_grafik_schedule';

const SHIFT_TYPES: ShiftType[] = ['day', 'night', 'full_day', 'off', 'vacation', 'sick'];

function isScheduleConfigV1(value: unknown): value is ScheduleConfigV1 {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<ScheduleConfigV1>;

  return (
    config.version === 1 &&
    typeof config.anchorDate === 'string' &&
    typeof config.preset === 'string' &&
    Array.isArray(config.cycle) &&
    config.cycle.length > 0 &&
    config.cycle.length <= 31 &&
    config.cycle.every((item) => SHIFT_TYPES.includes(item as ShiftType) && item !== 'vacation' && item !== 'sick') &&
    !!config.times &&
    typeof config.times.day?.start === 'string' &&
    typeof config.times.day?.end === 'string' &&
    typeof config.times.night?.start === 'string' &&
    typeof config.times.night?.end === 'string' &&
    typeof config.times.fullDay?.start === 'string' &&
    typeof config.times.fullDay?.end === 'string' &&
    !!config.overrides &&
    typeof config.overrides === 'object'
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

async function readFromVk(): Promise<string | null> {
  const response = await vkBridge.send('VKWebAppStorageGet', { keys: [STORAGE_KEY] });
  return response.keys?.find((item) => item.key === STORAGE_KEY)?.value || null;
}

async function writeToVk(value: string): Promise<void> {
  await vkBridge.send('VKWebAppStorageSet', { key: STORAGE_KEY, value });
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
    try {
      const fromVk = parseSchedule(await readFromVk());
      if (fromVk) {
        writeLocal(JSON.stringify(fromVk));
        return fromVk;
      }
    } catch {
      // Browser fallback below.
    }

    return parseSchedule(readLocal());
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
