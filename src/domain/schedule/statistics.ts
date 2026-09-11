import { daysInMonth, formatDateKey } from './date';
import { isWorkShift, resolveDay, resolvedShiftHours } from './engine';
import type { MonthStatistics, ScheduleConfigV1 } from './types';

export function calculateMonthStatistics(
  config: ScheduleConfigV1,
  year: number,
  month: number,
): MonthStatistics {
  const stats: MonthStatistics = {
    workShiftCount: 0,
    totalWorkHours: 0,
    offCount: 0,
    dayCount: 0,
    nightCount: 0,
    fullDayCount: 0,
    vacationCount: 0,
    sickCount: 0,
  };

  const count = daysInMonth(year, month);

  for (let day = 1; day <= count; day += 1) {
    const shift = resolveDay(config, formatDateKey(year, month, day)).shift;

    if (isWorkShift(shift)) {
      stats.workShiftCount += 1;
      stats.totalWorkHours += resolvedShiftHours(config, shift);
    }

    switch (shift) {
      case 'day':
        stats.dayCount += 1;
        break;
      case 'night':
        stats.nightCount += 1;
        break;
      case 'full_day':
        stats.fullDayCount += 1;
        break;
      case 'off':
        stats.offCount += 1;
        break;
      case 'vacation':
        stats.vacationCount += 1;
        break;
      case 'sick':
        stats.sickCount += 1;
        break;
    }
  }

  return stats;
}
