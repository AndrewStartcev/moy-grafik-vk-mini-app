import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Info,
  RefreshCw,
  SlidersHorizontal,
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
      <header className="settings-page-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Назад">
          <ArrowLeft size={21} strokeWidth={2.2} />
        </button>
        <div>
          <h1>Настройки</h1>
          <p>График и параметры смен</p>
        </div>
        <span className="header-spacer" />
      </header>

      <section className="settings-card">
        <div className="settings-section-title">
          <SlidersHorizontal size={18} />
          <h2>График</h2>
        </div>

        <button type="button" className="settings-link-row" onClick={onReconfigure}>
          <span className="settings-row-icon accent"><RefreshCw size={20} /></span>
          <span className="settings-row-copy">
            <strong>{PRESET_LABELS[config.preset]}</strong>
            <span>{config.cycle.length} дней в цикле</span>
          </span>
          <span className="settings-row-action">
            <span>Изменить</span>
            <ChevronRight size={18} />
          </span>
        </button>
      </section>

      <section className="settings-card">
        <div className="settings-section-title">
          <CalendarDays size={18} />
          <h2>Время смен</h2>
        </div>

        <div className="time-settings-list">
          {(Object.keys(TIME_LABELS) as TimeKey[]).map((key) => (
            <div className="time-setting" key={key}>
              <div className={`settings-row-icon shift-${TIME_SHIFT_TYPES[key]}`}>
                <ShiftIcon type={TIME_SHIFT_TYPES[key]} size={20} />
              </div>
              <div className="time-setting-copy">
                <strong>{TIME_LABELS[key]}</strong>
                <div className="time-inputs">
                  <label>
                    <span>Начало</span>
                    <input
                      type="time"
                      aria-label={`${TIME_LABELS[key]} начало`}
                      value={config.times[key].start}
                      onChange={(event) => updateTime(key, 'start', event.target.value)}
                    />
                  </label>
                  <span className="time-separator">—</span>
                  <label>
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
        </div>
      </section>

      <section className="settings-card settings-card-compact">
        <div className="settings-section-title">
          <CalendarDays size={18} />
          <h2>Календарь</h2>
        </div>
        <div className="settings-static-row">
          <span className="settings-row-icon neutral"><CalendarDays size={20} /></span>
          <span className="settings-row-copy">
            <strong>Первый день недели</strong>
            <span>Понедельник</span>
          </span>
        </div>
      </section>

      <section className="settings-card settings-card-compact">
        <div className="settings-section-title">
          <Info size={18} />
          <h2>Приложение</h2>
        </div>
        <div className="settings-static-row app-info-row">
          <AppIcon size={42} />
          <span className="settings-row-copy">
            <strong>Мой график</strong>
            <span>Версия 0.1.0 · VK Mini App</span>
          </span>
        </div>
      </section>

      <button type="button" className="danger-action" onClick={reset}>
        <Trash2 size={19} />
        Сбросить график
      </button>
    </main>
  );
}
