import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Settings,
  Share2,
} from 'lucide-react';
import { ShiftIcon } from '../../components/ShiftIcon';
import {
  daysInMonth,
  formatDateKey,
  parseDateKey,
  todayDateKey,
  weekdayMondayFirst,
} from '../../domain/schedule/date';
import { findNextWorkShift, resolveDay } from '../../domain/schedule/engine';
import {
  MONTHS_NOMINATIVE,
  SHIFT_LABELS,
  SHIFT_SHORT_LABELS,
  formatShortHumanDate,
  pluralDays,
} from '../../domain/schedule/presentation';
import { calculateMonthStatistics } from '../../domain/schedule/statistics';
import type { ScheduleConfigV1, ShiftType } from '../../domain/schedule/types';
import { ads } from '../../services/ads';
import { analytics } from '../../services/analytics';
import { stories, type StoryOpenResult } from '../../services/stories';
import { DaySheet } from './DaySheet';

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function shiftTime(config: ScheduleConfigV1, shift: ShiftType): string | null {
  if (shift === 'day') return `${config.times.day.start} — ${config.times.day.end}`;
  if (shift === 'night') return `${config.times.night.start} — ${config.times.night.end}`;
  if (shift === 'full_day') return `${config.times.fullDay.start} — ${config.times.fullDay.end}`;
  return null;
}

function storyStatusText(status: StoryOpenResult | 'idle'): string | null {
  if (status === 'opened') return 'Редактор истории открыт';
  if (status === 'unavailable') return 'Истории недоступны в этом клиенте VK';
  if (status === 'failed') return 'Не удалось открыть историю. Попробуй ещё раз.';
  return null;
}

interface CalendarScreenProps {
  config: ScheduleConfigV1;
  onChange: (config: ScheduleConfigV1) => void;
  onOpenSettings: () => void;
}

export function CalendarScreen({ config, onChange, onOpenSettings }: CalendarScreenProps) {
  const today = todayDateKey();
  const current = parseDateKey(today);
  const [view, setView] = useState({ year: current.year, month: current.month });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [storyStatus, setStoryStatus] = useState<StoryOpenResult | 'idle'>('idle');
  const [storyOpening, setStoryOpening] = useState(false);

  useEffect(() => {
    let active = true;

    const startAds = async () => {
      await ads.maybeShowInterstitial();
      if (active) await ads.showBanner();
    };

    void startAds();

    return () => {
      active = false;
      void ads.hideBanner();
    };
  }, []);

  const todayResolved = resolveDay(config, today);
  const nextShift = findNextWorkShift(config, today);
  const stats = useMemo(
    () => calculateMonthStatistics(config, view.year, view.month),
    [config, view],
  );

  const firstWeekday = weekdayMondayFirst(formatDateKey(view.year, view.month, 1));
  const monthDays = daysInMonth(view.year, view.month);

  const changeMonth = (direction: -1 | 1) => {
    const date = new Date(Date.UTC(view.year, view.month - 1 + direction, 1));
    setView({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 });
    analytics.track('calendar_month_changed', {
      direction: direction > 0 ? 'next' : 'previous',
    });
  };

  const openDay = (date: string) => {
    setSelectedDate(date);
    analytics.track('day_opened', { shift_type: resolveDay(config, date).shift });
  };

  const shareToStory = async () => {
    if (storyOpening) return;
    setStoryOpening(true);
    setStoryStatus('idle');

    const result = await stories.openScheduleStory(config);
    setStoryStatus(result);
    setStoryOpening(false);

    window.setTimeout(() => {
      setStoryStatus((currentStatus) => (currentStatus === result ? 'idle' : currentStatus));
    }, 3200);
  };

  const currentStoryStatusText = storyStatusText(storyStatus);

  return (
    <main className="screen calendar-screen">
      <header className="app-header">
        <div className="brand-inline brand-inline-text-only">
          <div className="brand-copy">
            <strong>Мой график</strong>
            <small>Календарь смен</small>
          </div>
        </div>
        <button
          type="button"
          className="icon-button settings-button"
          onClick={onOpenSettings}
          aria-label="Настройки"
        >
          <Settings size={21} strokeWidth={2.2} />
        </button>
      </header>

      <section className={`today-card shift-${todayResolved.shift}`}>
        <div className="today-main">
          <div className="today-icon" aria-hidden="true">
            <ShiftIcon type={todayResolved.shift} size={25} strokeWidth={2.1} />
          </div>
          <div className="today-content">
            <span>Сегодня, {formatShortHumanDate(today)}</span>
            <h1>{SHIFT_LABELS[todayResolved.shift]}</h1>
            {shiftTime(config, todayResolved.shift) && (
              <strong>{shiftTime(config, todayResolved.shift)}</strong>
            )}
          </div>
        </div>

        {nextShift && (
          <button type="button" className="next-shift" onClick={() => openDay(nextShift.date)}>
            <span className="next-shift-icon" aria-hidden="true">
              <CalendarClock size={18} />
            </span>
            <span className="next-shift-copy">
              <span>Следующая смена</span>
              <strong>
                {formatShortHumanDate(nextShift.date)} · через {nextShift.daysAway}{' '}
                {pluralDays(nextShift.daysAway)}
              </strong>
            </span>
            <ChevronRight className="next-shift-chevron" size={18} aria-hidden="true" />
          </button>
        )}
      </section>

      <section className="calendar-card">
        <div className="calendar-titlebar">
          <div>
            <span className="card-kicker">Календарь</span>
            <h2>{MONTHS_NOMINATIVE[view.month - 1]} {view.year}</h2>
          </div>
          <div className="month-controls">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Предыдущий месяц">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Следующий месяц">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="weekday-row" aria-hidden="true">
          {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="calendar-grid">
          {Array.from({ length: firstWeekday }, (_, index) => (
            <span className="calendar-empty" key={`empty-${index}`} />
          ))}
          {Array.from({ length: monthDays }, (_, index) => {
            const day = index + 1;
            const date = formatDateKey(view.year, view.month, day);
            const resolved = resolveDay(config, date);
            const isToday = date === today;

            return (
              <button
                type="button"
                key={date}
                className={`calendar-day shift-${resolved.shift} ${isToday ? 'is-today' : ''} ${resolved.isOverride ? 'is-override' : ''}`}
                onClick={() => openDay(date)}
                aria-label={`${day}. ${SHIFT_LABELS[resolved.shift]}`}
              >
                <span className="day-number">{day}</span>
                <span className="day-shift">{SHIFT_SHORT_LABELS[resolved.shift]}</span>
                {resolved.isOverride && <span className="override-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div className="calendar-legend" aria-label="Обозначения">
          <span className="legend-item"><i className="legend-dot work" />Работа</span>
          <span className="legend-item"><i className="legend-dot off" />Выходной</span>
          <span className="legend-item"><i className="legend-dot night" />Ночь</span>
          <span className="legend-item"><i className="legend-dot today" />Сегодня</span>
        </div>
      </section>

      <section className="stats-section">
        <div className="section-heading compact">
          <div>
            <span className="card-kicker">Статистика</span>
            <h2>Итоги за месяц</h2>
          </div>
          <span>{MONTHS_NOMINATIVE[view.month - 1]} {view.year}</span>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-card-icon"><CalendarDays size={18} /></span>
            <strong>{stats.workShiftCount}</strong>
            <span>смен</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-icon"><Clock3 size={18} /></span>
            <strong>{stats.totalWorkHours}</strong>
            <span>часов</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-icon"><ShiftIcon type="off" size={18} /></span>
            <strong>{stats.offCount}</strong>
            <span>выходных</span>
          </div>
        </div>

        {(stats.dayCount > 0 || stats.nightCount > 0 || stats.fullDayCount > 0) && (
          <p className="stats-breakdown">
            {stats.dayCount > 0 && `${stats.dayCount} дневных`}
            {stats.dayCount > 0 && stats.nightCount > 0 && ' · '}
            {stats.nightCount > 0 && `${stats.nightCount} ночных`}
            {(stats.dayCount > 0 || stats.nightCount > 0) && stats.fullDayCount > 0 && ' · '}
            {stats.fullDayCount > 0 && `${stats.fullDayCount} суточных`}
          </p>
        )}
      </section>

      <section className="share-section" aria-label="Поделиться графиком">
        <button
          type="button"
          className="share-story-button"
          onClick={() => void shareToStory()}
          disabled={storyOpening}
          aria-describedby={currentStoryStatusText ? 'share-story-status' : undefined}
        >
          <span className="share-story-icon" aria-hidden="true"><Share2 size={20} /></span>
          <span className="share-story-copy">
            <strong>{storyOpening ? 'Открываем историю…' : 'Поделиться графиком'}</strong>
            <span>Выложить в историю VK без рабочих дат</span>
          </span>
          <ChevronRight size={19} aria-hidden="true" />
        </button>
        {currentStoryStatusText && (
          <p
            id="share-story-status"
            className={`share-story-status is-${storyStatus}`}
            role="status"
          >
            {currentStoryStatusText}
          </p>
        )}
      </section>

      {selectedDate && (
        <DaySheet
          date={selectedDate}
          config={config}
          onChange={onChange}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </main>
  );
}
