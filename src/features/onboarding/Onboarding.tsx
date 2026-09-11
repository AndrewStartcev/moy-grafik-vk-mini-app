import { useMemo, useState } from 'react';
import { Button } from '@vkontakte/vkui';
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  RefreshCw,
  SlidersHorizontal,
  SunMoon,
} from 'lucide-react';
import { AppIcon } from '../../components/AppIcon';
import { ShiftIcon } from '../../components/ShiftIcon';
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
}> = [
  { id: '2x2', description: '2 рабочих · 2 выходных' },
  { id: '3x3', description: '3 рабочих · 3 выходных' },
  { id: '1x3', description: 'Сутки · 3 выходных' },
  { id: 'day-night-48', description: 'День · ночь · 2 выходных' },
  { id: '5x2', description: '5 рабочих · 2 выходных' },
  { id: 'custom', description: 'Свой повторяющийся цикл' },
];

const CUSTOM_OPTIONS: Array<{ type: CycleShiftType; label: string }> = [
  { type: 'day', label: 'Дневная' },
  { type: 'night', label: 'Ночная' },
  { type: 'full_day', label: 'Сутки' },
  { type: 'off', label: 'Выходной' },
];

const SHORT: Record<CycleShiftType, string> = {
  day: 'Д',
  night: 'Н',
  full_day: '24',
  off: 'В',
};

function PresetIcon({ preset }: { preset: SchedulePreset }) {
  const props = { size: 21, strokeWidth: 2.1, 'aria-hidden': true } as const;

  switch (preset) {
    case '2x2': return <RefreshCw {...props} />;
    case '3x3': return <CalendarDays {...props} />;
    case '1x3': return <Clock3 {...props} />;
    case 'day-night-48': return <SunMoon {...props} />;
    case '5x2': return <BriefcaseBusiness {...props} />;
    case 'custom': return <SlidersHorizontal {...props} />;
  }
}

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
      <section className="onboarding-brand">
        <AppIcon size={52} />
        <div className="onboarding-brand-copy">
          <span className="eyebrow">Мой график</span>
          <h1>Настрой смены за минуту</h1>
          <p>Выбери готовый график или собери свой цикл.</p>
        </div>
      </section>

      <section className="onboarding-section">
        <div className="section-heading">
          <div>
            <span className="card-kicker">Шаг 1</span>
            <h2>Выбери график</h2>
          </div>
        </div>

        <div className="preset-grid" role="radiogroup" aria-label="Тип графика">
          {PRESETS.map((item) => {
            const selected = preset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`preset-card ${selected ? 'is-selected' : ''}`}
                onClick={() => selectPreset(item.id)}
                role="radio"
                aria-checked={selected}
              >
                <span className="preset-icon"><PresetIcon preset={item.id} /></span>
                <span className="preset-copy">
                  <strong>{PRESET_LABELS[item.id]}</strong>
                  <span>{item.description}</span>
                </span>
                {selected && <span className="preset-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
      </section>

      {preset === 'custom' && (
        <section className="custom-cycle-card">
          <div className="section-heading">
            <div>
              <span className="card-kicker">Свой вариант</span>
              <h2>Собери цикл</h2>
              <p>Добавляй дни по порядку. Нажми на день, чтобы удалить его.</p>
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
                <ShiftIcon type={item.type} size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="date-card">
        <div className="section-heading">
          <div>
            <span className="card-kicker">Шаг 2</span>
            <h2>Первый день цикла</h2>
            <p>Дата, с которой начинается выбранный график.</p>
          </div>
        </div>
        <input
          id="anchor-date"
          aria-label="Первый день цикла"
          type="date"
          value={anchorDate}
          onChange={(event) => setAnchorDate(event.target.value)}
        />
      </section>

      <div className="onboarding-submit">
        <Button size="l" stretched disabled={!canSubmit} onClick={submit}>
          Построить график
        </Button>
      </div>
    </main>
  );
}
