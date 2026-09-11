import { Clock3, Coffee, Moon, Sun, Thermometer, Umbrella } from 'lucide-react';
import type { ShiftType } from '../domain/schedule/types';

interface ShiftIconProps {
  type: ShiftType;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ShiftIcon({ type, size = 22, strokeWidth = 2, className }: ShiftIconProps) {
  const props = { size, strokeWidth, className, 'aria-hidden': true } as const;

  switch (type) {
    case 'day':
      return <Sun {...props} />;
    case 'night':
      return <Moon {...props} />;
    case 'full_day':
      return <Clock3 {...props} />;
    case 'vacation':
      return <Umbrella {...props} />;
    case 'sick':
      return <Thermometer {...props} />;
    case 'off':
    default:
      return <Coffee {...props} />;
  }
}
