import { CalendarDays } from 'lucide-react';

interface AppIconProps {
  size?: number;
  className?: string;
  decorative?: boolean;
}

export function AppIcon({ size = 44, className = '', decorative = true }: AppIconProps) {
  return (
    <span
      className={`app-icon ${className}`.trim()}
      style={{ width: size, height: size }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Мой график'}
      aria-hidden={decorative || undefined}
    >
      <CalendarDays
        size={Math.round(size * 0.53)}
        strokeWidth={2.35}
        aria-hidden="true"
      />
    </span>
  );
}
