interface AppIconProps {
  size?: number;
  className?: string;
  decorative?: boolean;
}

export function AppIcon({ size = 44, className = '', decorative = true }: AppIconProps) {
  return (
    <img
      src="/app-icon.png"
      width={size}
      height={size}
      className={`app-icon ${className}`.trim()}
      alt={decorative ? '' : 'Мой график'}
      aria-hidden={decorative || undefined}
      draggable={false}
    />
  );
}
