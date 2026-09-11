import { useMemo, useState } from 'react';
import { Button } from '@vkontakte/vkui';
import { createScheduleConfig } from '../../domain/schedule/config';
import { PRESET_LABELS } from '../../domain/schedule/presets';
import { todayDateKey } from '../../domain/schedule/date';
import type {
  CycleShiftType,
  ScheduleConfigV1,
  SchedulePreset,
} from '../../domain/schedule/types';
import { analytics } from '../../services/analytics';

const PRESETS: Array<{
  id: SchedulePreset;
  description: string;
  icon: string;
}> = [
  { id: '2x2', description: '2 рабочих · 2 выходных', icon: '↻' },
  { id: '3x3', description: '3 рабочих · 3 выходных', icon: '▦' },
  { id: '1x3', description: '1 смена (24 ч) · 3 выходных', icon: '◐' },
  { id: 'day-night-48', description: 'Чередование дневных и ночных', icon: '☀︎ · ☾' },
  { id: '5x2', description: '5 рабочих · 2 выходных', icon: '▣' },
  { id: 'custom', description: 'Настрой свой вариант', icon: '⚙' },
];

const CUSTOM_OPTIONS: Array<{ type: CycleShiftType; label: string }> = [
  { type: 'day', label: '+ Дневная' },
  { type: 'night', label: '+ Ночная' },
  { type: 'full_day', label: '+ Сутки' },
  { type: 'off', label: '+ Выходной' },
];

const SHORT: Record<CycleShiftType, string> = {
  day: 'Д',
  night: 'Н',
  full_day: '24',
  off: 'В',
};

interface OnboardingProps {
  onCreate: (config: ScheduleConfigV1) => void;
}

export function Onboarding({ onCreate }: OnboardingProps) {
  const [preset, setPreset] = useState<SchedulePreset>('2x2');
  const [anchorDate, setAnchorDate] = useState(todayDateKey());
  const [customCycle, setCustomCycle] = useState<CycleShiftType[]>(['day', 'day', 'off', 'off']);

  const canSubmit = anchorDate.length === 10 && (preset !== 'custom' || customCycle.length > 0);
  const customDescription = useMemo(
    () => customCycle.map((item) => SHORT[item]).join(' · '),
    [customCycle],
  );

  const selectPreset = (value: SchedulePreset) => {
    setPreset(value);
    analytics.track('preset_selected', { preset: value });
  };

  const appendCustom = (type: CycleShiftType) => {
    setCustomCycle((current) => (current.length < 31 ? [...current, type] : current));
  };

  const removeCustomAt = (index: number) => {
    setCustomCycle((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = () => {
    if (!canSubmit) return;

    const config = createScheduleConfig({
      preset,
      anchorDate,
      customCycle: preset === 'custom' ? customCycle : undefined,
    });

    analytics.track('schedule_created', {
      preset,
      cycle_length: config.cycle.length,
    });
    onCreate(config);
  };

  return (
    <main className="screen onboarding-screen">
      <section className="hero-copy">
        <img
          className="app-mark"
          src="/assets/app-icon-256.png"
          alt=""
          aria-hidden="true"
          style={{ objectFit: 'cover' }}
        />
        <div>
          <div className="eyebrow">Мой график</div>
          <h1>Как ты работаешь?</h1>
          <p>Выбери график или настрой свой вариант.</p>
        </div>
      </section>

      <div className="preset-grid" role="radiogroup" aria-label="Тип графика">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`preset-card ${preset === item.id ? 'is-selected' : ''}`}
            onClick={() => selectPreset(item.id)}
            role="radio"
            aria-checked={preset === item.id}
          >
            <span className="preset-icon" aria-hidden="true">{item.icon}</span>
            <strong>{PRESET_LABELS[item.id]}</strong>
            <span>{item.description}</span>
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <section className="custom-cycle-card">
          <div className="section-heading">
            <div>
              <h2>Свой цикл</h2>
              <p>Добавь дни в порядке, в котором они повторяются.</p>
            </div>
            <span className="counter">{customCycle.length}/31</span>
          </div>

          <div className="cycle-preview" aria-label={`Цикл: ${customDescription || 'пусто'}`}>
            {customCycle.length === 0 && <span className="cycle-empty">Добавь хотя бы один день</span>}
            {customCycle.map((type, index) => (
              <button
                key={`${type}-${index}`}
                type="button"
                className={`cycle-chip shift-${type}`}
                onClick={() => removeCustomAt(index)}
                title="Нажми, чтобы удалить"
              >
                {SHORT[type]}
              </button>
            ))}
          </div>

          <div className="cycle-actions">
            {CUSTOM_OPTIONS.map((item) => (
              <button
                type="button"
                key={item.type}
                onClick={() => appendCustom(item.type)}
                disabled={customCycle.length >= 31}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="date-card">
        <label htmlFor="anchor-date">С какого числа начать?</label>
        <p>Выбери первый день указанного цикла.</p>
        <input
          id="anchor-date"
          type="date"
          value={anchorDate}
          onChange={(event) => setAnchorDate(event.target.value)}
        />
      </section>

      <Button size="l" stretched disabled={!canSubmit} onClick={submit}>
        Построить график
      </Button>
    </main>
  );
}
