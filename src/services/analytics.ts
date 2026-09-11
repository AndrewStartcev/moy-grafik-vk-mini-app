import { vkPlatform } from './vkPlatform';

export type AnalyticsEvent =
  | 'app_open'
  | 'app_ready'
  | 'app_error'
  | 'app_hide'
  | 'app_restore'
  | 'onboarding_open'
  | 'preset_selected'
  | 'custom_cycle_created'
  | 'schedule_created'
  | 'calendar_month_changed'
  | 'day_opened'
  | 'day_overridden'
  | 'day_override_removed'
  | 'settings_open'
  | 'schedule_reset'
  | 'shift_time_changed'
  | 'ad_request'
  | 'ad_shown'
  | 'ad_failed';

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsService {
  track(event: AnalyticsEvent, payload?: AnalyticsPayload): void;
  flush(): Promise<void>;
}

interface AnalyticsEnvelope {
  event: AnalyticsEvent;
  timestamp: string;
  session_id: string;
  app_id: number | null;
  platform: string | null;
  language: string;
  payload: AnalyticsPayload;
}

const COUNTERS_KEY = 'moy_grafik_analytics_counters';
const ANALYTICS_ENDPOINT = (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined)?.trim();
const MAX_BATCH_SIZE = 50;
const FLUSH_DELAY_MS = 1500;

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function incrementLocalCounter(event: AnalyticsEvent): void {
  try {
    const raw = window.localStorage.getItem(COUNTERS_KEY);
    const counters = raw ? JSON.parse(raw) as Record<string, number> : {};
    counters[event] = (counters[event] ?? 0) + 1;
    window.localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
  } catch {
    // Analytics must never affect the product.
  }
}

class AppAnalyticsService implements AnalyticsService {
  private readonly sessionId = createSessionId();
  private queue: AnalyticsEnvelope[] = [];
  private flushTimer: number | null = null;

  track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
    incrementLocalCounter(event);

    if (import.meta.env.DEV) {
      console.debug('[analytics]', event, payload);
    }

    if (!ANALYTICS_ENDPOINT) return;

    this.queue.push({
      event,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      app_id: typeof vkPlatform.appId === 'number' ? vkPlatform.appId : null,
      platform: vkPlatform.platform,
      language: String(vkPlatform.language || 'ru'),
      payload,
    });

    if (this.queue.length >= MAX_BATCH_SIZE) {
      void this.flush();
      return;
    }

    if (this.flushTimer === null) {
      this.flushTimer = window.setTimeout(() => {
        this.flushTimer = null;
        void this.flush();
      }, FLUSH_DELAY_MS);
    }
  }

  async flush(): Promise<void> {
    if (!ANALYTICS_ENDPOINT || this.queue.length === 0) return;

    if (this.flushTimer !== null) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const batch = this.queue.splice(0, MAX_BATCH_SIZE);
    const body = JSON.stringify({ events: batch });

    try {
      if (typeof navigator.sendBeacon === 'function') {
        const sent = navigator.sendBeacon(
          ANALYTICS_ENDPOINT,
          new Blob([body], { type: 'application/json' }),
        );
        if (sent) return;
      }

      const response = await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      });

      if (!response.ok) throw new Error(`analytics_http_${response.status}`);
    } catch {
      this.queue = [...batch, ...this.queue].slice(0, MAX_BATCH_SIZE * 4);
    }
  }
}

export const analytics: AnalyticsService = new AppAnalyticsService();
