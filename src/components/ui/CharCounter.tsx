import React from 'react';

interface CharCounterProps {
  value: string;
  max: number;
  /** Show counter when this many chars remain (default: max * 0.2) */
  warnAt?: number;
}

/**
 * A character counter that shows below a textarea.
 * Only becomes visible when the user is within `warnAt` chars of the limit.
 */
const CharCounter: React.FC<CharCounterProps> = ({ value, max, warnAt }) => {
  const used = value.length;
  const remaining = max - used;
  const threshold = warnAt ?? Math.floor(max * 0.2);
  const isNear = remaining <= threshold;
  const isAtLimit = remaining <= 0;

  if (!isNear) return null;

  const pct = (used / max) * 100;

  return (
    <div className="mt-1 animate-fade-in">
      {/* Progress bar */}
      <div
        className="h-0.5 rounded-full overflow-hidden mb-1"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: isAtLimit ? '#dc2626' : remaining <= threshold * 0.4 ? '#b45309' : '#888888',
          }}
        />
      </div>

      {/* Label */}
      <div
        className="flex items-center justify-between text-xs"
        style={{
          color: isAtLimit ? '#dc2626' : remaining <= threshold * 0.4 ? '#b45309' : 'var(--text-muted)',
        }}
      >
        <span>
          {isAtLimit
            ? '⚠ Character limit reached'
            : `${remaining.toLocaleString()} character${remaining !== 1 ? 's' : ''} remaining`}
        </span>
        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
          {used.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default CharCounter;
