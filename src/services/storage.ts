import vkBridge from '@vkontakte/vk-bridge';
import type {
  CycleShiftType,
  ScheduleConfigV1,
  SchedulePreset,
  ShiftType,
} from '../domain/schedule/types';

const LOCAL_STORAGE_KEY = 'moy_grafik_schedule';
const LEGACY_VK_STORAGE_KEY = 'moy_grafik_schedule';
const VK_META_KEY = 'moy_grafik_schedule_meta';
const VK_CHUNK_PREFIX = 'moy_grafik_schedule_chunk_';
const VK_STORAGE_TIMEOUT_MS = 1400;
const VK_WRITE_DEBOUNCE_MS = 600;
const VK_CHUNK_SIZE = 3000;
const MAX_CHUNKS = 32;

const CYCLE_SHIFT_TYPES: CycleShiftType[] = ['day', 'night', 'full_day', 'off'];
const SHIFT_TYPES: ShiftType[] = ['day', 'night', 'full_day', 'off', 'vacation', 'sick'];
const SCHEDULE_PRESETS: SchedulePreset[] = ['2x2', '3x3', '5x2', '1x3', 'day-night-48', 'custom'];

let pendingSerialized: string | null = null;
let debounceTimer: number | null = null;
let writeQueue: Promise<void> = Promise.resolve();

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

function readLocal(): string | null {
  try {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLocal(value: string): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, value);
  } catch {
    // Product remains usable in-memory if browser storage is unavailable.
  }
}

function removeLocal(): void {
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Ignore local storage cleanup failure.
  }
}

async function vkGet(keys: string[]): Promise<Record<string, string>> {
  if (!vkBridge.isEmbedded()) return {};

  const response = await withTimeout(
    vkBridge.send('VKWebAppStorageGet', { keys }),
    null,
    VK_STORAGE_TIMEOUT_MS,
  );

  if (!response) return {};

  return Object.fromEntries((response.keys ?? []).map((item) => [item.key, item.value ?? '']));
}

async function vkSet(key: string, value: string): Promise<void> {
  if (!vkBridge.isEmbedded()) return;

  await withTimeout(
    vkBridge.send('VKWebAppStorageSet', { key, value }).then(() => undefined),
    undefined,
    VK_STORAGE_TIMEOUT_MS,
  );
}

function splitIntoChunks(value: string): string[] {
  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += VK_CHUNK_SIZE) {
    chunks.push(value.slice(offset, offset + VK_CHUNK_SIZE));
  }
  return chunks;
}

function parseChunkCount(raw: string | undefined): number {
  if (!raw) return 0;
  try {
    const meta = JSON.parse(raw) as { version?: unknown; chunks?: unknown };
    if (meta.version !== 1 || typeof meta.chunks !== 'number') return 0;
    if (!Number.isInteger(meta.chunks) || meta.chunks < 0 || meta.chunks > MAX_CHUNKS) return 0;
    return meta.chunks;
  } catch {
    return 0;
  }
}

async function readFromVk(): Promise<string | null> {
  const head = await vkGet([VK_META_KEY, LEGACY_VK_STORAGE_KEY]);
  const chunkCount = parseChunkCount(head[VK_META_KEY]);

  if (chunkCount > 0) {
    const keys = Array.from({ length: chunkCount }, (_, index) => `${VK_CHUNK_PREFIX}${index}`);
    const values = await vkGet(keys);
    const chunks = keys.map((key) => values[key] ?? '');
    if (chunks.every(Boolean)) return chunks.join('');
  }

  return head[LEGACY_VK_STORAGE_KEY] || null;
}

async function writeChunkedToVk(value: string): Promise<void> {
  const chunks = splitIntoChunks(value);
  if (chunks.length > MAX_CHUNKS) {
    throw new Error('schedule_storage_too_large');
  }

  const previous = await vkGet([VK_META_KEY]);
  const previousChunkCount = parseChunkCount(previous[VK_META_KEY]);

  for (let index = 0; index < chunks.length; index += 1) {
    await vkSet(`${VK_CHUNK_PREFIX}${index}`, chunks[index]);
  }

  await vkSet(VK_META_KEY, JSON.stringify({ version: 1, chunks: chunks.length }));
  await vkSet(LEGACY_VK_STORAGE_KEY, '');

  for (let index = chunks.length; index < previousChunkCount; index += 1) {
    await vkSet(`${VK_CHUNK_PREFIX}${index}`, '');
  }
}

function enqueueVkWrite(value: string): void {
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => writeChunkedToVk(value));
}

function scheduleVkWrite(value: string): void {
  pendingSerialized = value;
  if (debounceTimer !== null) window.clearTimeout(debounceTimer);

  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    const next = pendingSerialized;
    pendingSerialized = null;
    if (next !== null) enqueueVkWrite(next);
  }, VK_WRITE_DEBOUNCE_MS);
}

async function flushPendingWrite(): Promise<void> {
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (pendingSerialized !== null) {
    const next = pendingSerialized;
    pendingSerialized = null;
    enqueueVkWrite(next);
  }

  try {
    await writeQueue;
  } catch {
    // localStorage remains the authoritative fallback.
  }
}

async function clearVk(): Promise<void> {
  if (!vkBridge.isEmbedded()) return;

  const head = await vkGet([VK_META_KEY]);
  const chunkCount = parseChunkCount(head[VK_META_KEY]);

  await vkSet(VK_META_KEY, JSON.stringify({ version: 1, chunks: 0 }));
  await vkSet(LEGACY_VK_STORAGE_KEY, '');

  for (let index = 0; index < chunkCount; index += 1) {
    await vkSet(`${VK_CHUNK_PREFIX}${index}`, '');
  }
}

export const scheduleStorage = {
  async load(): Promise<ScheduleConfigV1 | null> {
    const local = parseSchedule(readLocal());
    if (local) return local;

    try {
      const raw = await readFromVk();
      const fromVk = parseSchedule(raw);
      if (fromVk && raw) {
        writeLocal(raw);
        return fromVk;
      }
    } catch {
      // Browser/local fallback below.
    }

    return null;
  },

  save(config: ScheduleConfigV1): void {
    const serialized = JSON.stringify(config);
    writeLocal(serialized);
    scheduleVkWrite(serialized);
  },

  async flush(): Promise<void> {
    await flushPendingWrite();
  },

  async clear(): Promise<void> {
    removeLocal();
    pendingSerialized = null;

    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    await flushPendingWrite();

    try {
      await clearVk();
    } catch {
      // Ignore VK cleanup failure; local data is already removed.
    }
  },
};
