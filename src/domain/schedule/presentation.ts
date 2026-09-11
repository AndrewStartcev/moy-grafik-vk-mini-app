import type { ShiftType } from './types';

export const SHIFT_LABELS: Record<ShiftType, string> = {
  day: 'Дневная смена',
  night: 'Ночная смена',
  full_day: 'Сутки',
  off: 'Выходной',
  vacation: 'Отпуск',
  sick: 'Больничный',
};

export const SHIFT_SHORT_LABELS: Record<ShiftType, string> = {
  day: 'Д',
  night: 'Н',
  full_day: '24',
  off: 'В',
  vacation: 'О',
  sick: 'Б',
};

export const SHIFT_ICONS: Record<ShiftType, string> = {
  day: '☀️',
  night: '🌙',
  full_day: '24',
  off: '○',
  vacation: '🌴',
  sick: '✚',
};

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export const MONTHS_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export function formatHumanDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${day} ${MONTHS_GENITIVE[month - 1]} ${year}`;
}

export function formatShortHumanDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-').map(Number);
  return `${day} ${MONTHS_GENITIVE[month - 1]}`;
}

export function pluralDays(value: number): string {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'дней';
  if (last === 1) return 'день';
  if (last > 1 && last < 5) return 'дня';
  return 'дней';
}
