import { useState } from 'react';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
};

const SIZES = { sm: 16, md: 24, lg: 36 } as const;

export default function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly = false,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const px = SIZES[size];
  const filled = '#1E2D4A';
  const empty = '#D1D5DB';

  return (
    <div
      className="inline-flex items-center"
      style={{ gap: size === 'lg' ? 6 : 2 }}
      onMouseLeave={() => !readOnly && setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hover ? star <= hover : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            className="bg-transparent border-none p-0 outline-none disabled:cursor-default"
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              minWidth: 44,
              minHeight: size === 'lg' ? 44 : undefined,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 200ms ease',
              transform: !readOnly && hover === star ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            <svg
              width={px}
              height={px}
              viewBox="0 0 24 24"
              fill={active ? filled : 'none'}
              stroke={active ? filled : empty}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'fill 200ms ease, stroke 200ms ease' }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
