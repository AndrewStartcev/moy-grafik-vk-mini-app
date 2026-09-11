export type AnalyticsEvent =
  | 'app_open'
  | 'app_ready'
  | 'app_error'
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
}

class DevAnalyticsService implements AnalyticsService {
  track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
    if (import.meta.env.DEV) {
      console.debug('[analytics]', event, payload);
    }
  }
}

export const analytics: AnalyticsService = new DevAnalyticsService();
