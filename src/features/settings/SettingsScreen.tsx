import { PRESET_LABELS } from '../../domain/schedule/presets';
import type { ScheduleConfigV1 } from '../../domain/schedule/types';
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
      <header className="app-header settings-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Назад">‹</button>
        <h1>Настройки</h1>
        <span className="header-spacer" />
      </header>

      <section className="settings-card">
        <h2>График</h2>
        <div className="settings-row">
          <div className="settings-row-icon">↻</div>
          <div className="settings-row-copy">
            <strong>{PRESET_LABELS[config.preset]}</strong>
            <span>{config.cycle.length} дней в цикле</span>
          </div>
        </div>
        <button type="button" className="secondary-action" onClick={onReconfigure}>
          Изменить график
        </button>
      </section>

      <section className="settings-card">
        <h2>Смена</h2>
        {(Object.keys(TIME_LABELS) as TimeKey[]).map((key) => (
          <div className="time-setting" key={key}>
            <div className={`settings-row-icon shift-${key === 'fullDay' ? 'full_day' : key}`}>
              {key === 'day' ? '☀' : key === 'night' ? '☾' : '24'}
            </div>
            <div className="time-setting-copy">
              <strong>{TIME_LABELS[key]}</strong>
              <div className="time-inputs">
                <input
                  type="time"
                  aria-label={`${TIME_LABELS[key]} начало`}
                  value={config.times[key].start}
                  onChange={(event) => updateTime(key, 'start', event.target.value)}
                />
                <span>—</span>
                <input
                  type="time"
                  aria-label={`${TIME_LABELS[key]} конец`}
                  value={config.times[key].end}
                  onChange={(event) => updateTime(key, 'end', event.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="settings-card">
        <h2>Календарь</h2>
        <div className="settings-row">
          <div className="settings-row-icon">▦</div>
          <div className="settings-row-copy">
            <strong>Первый день недели</strong>
            <span>Понедельник</span>
          </div>
        </div>
      </section>

      <section className="settings-card app-info-card">
        <h2>Приложение</h2>
        <div className="settings-row">
          <div className="settings-row-icon">ⓘ</div>
          <div className="settings-row-copy">
            <strong>Мой график</strong>
            <span>Версия 0.1.0 · MVP</span>
          </div>
        </div>
      </section>

      <button type="button" className="danger-action" onClick={reset}>
        Сбросить график
      </button>
    </main>
  );
}
