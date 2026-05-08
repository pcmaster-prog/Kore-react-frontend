import { cx } from "@/lib/utils";

export interface ProgressRingProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function ProgressRing({
  pct,
  size = 40,
  strokeWidth = 4,
  className,
}: ProgressRingProps) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const cxPos = size / 2;
  const cyPos = size / 2;

  return (
    <div className={cx("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={cxPos}
          cy={cyPos}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cxPos}
          cy={cyPos}
          r={r}
          fill="none"
          stroke={pct >= 100 ? "#10b981" : "#6366f1"}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-k-text-h">
        {pct}%
      </span>
    </div>
  );
}
