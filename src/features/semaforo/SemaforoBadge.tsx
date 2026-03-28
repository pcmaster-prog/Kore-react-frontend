import type { SemaforoColor } from './types';
import { SEMAFORO_CONFIG } from './utils';

type SemaforoBadgeProps = {
  status: SemaforoColor;
  showDot?: boolean;
  size?: 'sm' | 'md';
};

export default function SemaforoBadge({
  status,
  showDot = false,
  size = 'sm',
}: SemaforoBadgeProps) {
  if (!status) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium"
        style={{
          background: '#f3f4f6',
          color: '#6b7280',
          borderColor: '#e5e7eb',
          fontSize: size === 'md' ? 13 : 12,
        }}
      >
        {showDot && (
          <span
            className="inline-block rounded-full"
            style={{ width: 8, height: 8, background: '#9ca3af' }}
          />
        )}
        Sin evaluar
      </span>
    );
  }

  const cfg = SEMAFORO_CONFIG[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium"
      style={{
        background: cfg.badgeBg,
        color: cfg.badgeText,
        borderColor: cfg.badgeText + '30',
        fontSize: size === 'md' ? 13 : 12,
      }}
    >
      {showDot && (
        <span
          className="inline-block rounded-full"
          style={{ width: 8, height: 8, background: cfg.progressColor }}
        />
      )}
      {cfg.label}
    </span>
  );
}
