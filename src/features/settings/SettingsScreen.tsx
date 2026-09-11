import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Info,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AppIcon } from '../../components/AppIcon';
import { ShiftIcon } from '../../components/ShiftIcon';
import { PRESET_LABELS } from '../../domain/schedule/presets';
import type { ScheduleConfigV1, ShiftType } from '../../domain/schedule/types';
import { analytics } from '../../services/analytics';

interface SettingsScreenProps {
  config: ScheduleConfigV1;
  onBack: () => void;
  onChange: (config: ScheduleConfigV1) => void;
  onReconfigure: () => void;
  onReset: () => void;
}

type TimeKey = 'day' | 'night' | 'fullDay';

const TIME_LABELS: Record<TimeKey, string> = {
  day: 'Дневная смена',
  night: 'Ночная смена',
  fullDay: 'Сутки',
};

const TIME_SHIFT_TYPES: Record<TimeKey, ShiftType> = {
  day: 'day',
  night: 'night',
  fullDay: 'full_day',
};

export function SettingsScreen({
  config,
  onBack,
  onChange,
  onReconfigure,
  onReset,
}: SettingsScreenProps) {
  const updateTime = (key: TimeKey, field: 'start' | 'end', value: string) => {
    analytics.track('shift_time_changed', { shift_type: key });
    onChange({
      ...config,
      times: {
        ...config.times,
        [key]: {
          ...config.times[key],
          [field]: value,
        },
      },
    });
  };

  const reset = () => {
    if (window.confirm('Сбросить график и все ручные изменения?')) {
      analytics.track('schedule_reset');
      onReset();
    }
  };

  return (
    <main className="screen settings-screen">
      <header className="settings-nav">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Назад">
          <ArrowLeft size={21} strokeWidth={2.2} />
        </button>
        <div className="settings-nav-copy">
          <strong>Настройки</strong>
          <span>График и параметры смен</span>
        </div>
        <span className="header-spacer" aria-hidden="true" />
      </header>

      <div className="settings-group">
        <span className="settings-group-label">График</span>
        <section className="settings-list">
          <button type="button" className="settings-row-button" onClick={onReconfigure}>
            <span className="settings-row-icon accent"><RefreshCw size={20} /></span>
            <span className="settings-row-copy">
              <strong>Рабочий цикл</strong>
              <span>{PRESET_LABELS[config.preset]} · {config.cycle.length} дней</span>
            </span>
            <ChevronRight className="settings-chevron" size={19} aria-hidden="true" />
          </button>
        </section>
      </div>

      <div className="settings-group">
        <span className="settings-group-label">Время смен</span>
        <section className="settings-list time-settings-list">
          {(Object.keys(TIME_LABELS) as TimeKey[]).map((key) => (
            <div className="time-setting" key={key}>
              <span
                className={`settings-row-icon shift-${TIME_SHIFT_TYPES[key]}`}
                style={{ background: 'var(--shift-bg)', color: 'var(--shift-fg)' }}
                aria-hidden="true"
              >
                <ShiftIcon type={TIME_SHIFT_TYPES[key]} size={20} />
              </span>

              <div className="time-setting-body">
                <strong>{TIME_LABELS[key]}</strong>
                <div className="time-inputs">
                  <label className="time-field">
                    <span>Начало</span>
                    <input
                      type="time"
                      aria-label={`${TIME_LABELS[key]} начало`}
                      value={config.times[key].start}
                      onChange={(event) => updateTime(key, 'start', event.target.value)}
                    />
                  </label>
                  <span className="time-separator" aria-hidden="true">—</span>
                  <label className="time-field">
                    <span>Конец</span>
                    <input
                      type="time"
                      aria-label={`${TIME_LABELS[key]} конец`}
                      value={config.times[key].end}
                      onChange={(event) => updateTime(key, 'end', event.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="settings-group">
        <span className="settings-group-label">Календарь</span>
        <section className="settings-list">
          <div className="settings-static-row">
            <span className="settings-row-icon neutral" aria-hidden="true"><CalendarDays size={20} /></span>
            <span className="settings-row-copy">
              <strong>Первый день недели</strong>
              <span>Понедельник</span>
            </span>
          </div>
        </section>
      </div>

      <div className="settings-group">
        <span className="settings-group-label">Приложение</span>
        <section className="settings-list">
          <div className="settings-static-row app-info-row">
            <AppIcon size={40} />
            <span className="settings-row-copy">
              <strong>Мой график</strong>
              <span>Версия 0.1.0 · VK Mini App</span>
            </span>
            <Info className="settings-muted-icon" size={18} aria-hidden="true" />
          </div>
        </section>
      </div>

      <div className="settings-group danger-group">
        <button type="button" className="danger-row" onClick={reset}>
          <Trash2 size={19} />
          <span>Сбросить график</span>
        </button>
      </div>
    </main>
  );
}
