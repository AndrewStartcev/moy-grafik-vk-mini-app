import { Check, RotateCcw, X } from 'lucide-react';
import { ShiftIcon } from '../../components/ShiftIcon';
import { SHIFT_LABELS, formatHumanDate } from '../../domain/schedule/presentation';
import { resolveDay, withOverride, withoutOverride } from '../../domain/schedule/engine';
import type { ScheduleConfigV1, ShiftType } from '../../domain/schedule/types';
import { analytics } from '../../services/analytics';

const OPTIONS: ShiftType[] = ['day', 'night', 'full_day', 'off', 'vacation', 'sick'];

function shiftTime(config: ScheduleConfigV1, type: ShiftType): string | null {
  if (type === 'day') return `${config.times.day.start} — ${config.times.day.end}`;
  if (type === 'night') return `${config.times.night.start} — ${config.times.night.end}`;
  if (type === 'full_day') return `${config.times.fullDay.start} — ${config.times.fullDay.end}`;
  return null;
}

interface DaySheetProps {
  date: string;
  config: ScheduleConfigV1;
  onChange: (config: ScheduleConfigV1) => void;
  onClose: () => void;
}

export function DaySheet({ date, config, onChange, onClose }: DaySheetProps) {
  const resolved = resolveDay(config, date);

  const choose = (shift: ShiftType) => {
    analytics.track('day_overridden', {
      from_type: resolved.shift,
      to_type: shift,
    });
    onChange(withOverride(config, date, shift));
    onClose();
  };

  const restore = () => {
    analytics.track('day_override_removed');
    onChange(withoutOverride(config, date));
    onClose();
  };

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="day-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Изменить ${formatHumanDate(date)}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <span className="card-kicker">Изменить день</span>
            <h2>{formatHumanDate(date)}</h2>
            <p>По базовому графику: {SHIFT_LABELS[resolved.baseShift]}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className="shift-options">
          {OPTIONS.map((type) => {
            const time = shiftTime(config, type);
            const checked = resolved.shift === type;
            return (
              <button
                type="button"
                key={type}
                className={`shift-option shift-${type} ${checked ? 'is-current' : ''}`}
                onClick={() => choose(type)}
              >
                <span className="shift-option-icon" aria-hidden="true"><ShiftIcon type={type} size={20} /></span>
                <span className="shift-option-copy">
                  <strong>{SHIFT_LABELS[type]}</strong>
                  <small>{time ?? (type === 'off' ? 'Без смены' : type === 'vacation' ? 'Отпуск' : 'Больничный')}</small>
                </span>
                <span className={`radio-dot ${checked ? 'is-checked' : ''}`} aria-hidden="true">
                  {checked && <Check size={13} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        {resolved.isOverride && (
          <button type="button" className="restore-button" onClick={restore}>
            <RotateCcw size={18} />
            Вернуть по графику
          </button>
        )}
      </section>
    </div>
  );
}
