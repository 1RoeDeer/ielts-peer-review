import React from 'react';
import { useStore } from '../../store/useStore';
import type { ReviewerRank } from '../../types';
import { Flame, Award } from 'lucide-react';

const RANK_CONFIG: Record<ReviewerRank, { label: string; emoji: string; minXp: number; maxXp: number; color: string; bg: string }> = {
  novice:          { label: 'Novice Reviewer',  emoji: '📝', minXp: 0,    maxXp: 200,  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  rising_star:     { label: 'Rising Star',       emoji: '⭐', minXp: 200,  maxXp: 500,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  senior_peer:     { label: 'Senior Peer',       emoji: '🎯', minXp: 500,  maxXp: 1000, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  master_examiner: { label: 'Master Examiner',   emoji: '🎖️', minXp: 1000, maxXp: 2000, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
};

interface Props {
  collapsed?: boolean;
}

const GamificationBar: React.FC<Props> = ({ collapsed }) => {
  const { xp, streak, badges, reviewerRank } = useStore();
  const rank = RANK_CONFIG[reviewerRank];
  const progress = Math.min(100, ((xp - rank.minXp) / (rank.maxXp - rank.minXp)) * 100);
  const xpToNext = rank.maxXp - xp;

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-3 px-1"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ background: rank.bg, border: `1px solid ${rank.color}30` }}
          title={`${rank.label} — ${xp} XP`}
        >
          {rank.emoji}
        </div>
        {streak > 0 && (
          <div
            className="flex items-center gap-0.5 text-xs font-bold"
            style={{ color: '#f97316' }}
            title={`${streak} day streak`}
          >
            <Flame size={12} />
            <span className="text-[10px]">{streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="px-3 py-3"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base" title={rank.label}>{rank.emoji}</span>
          <div>
            <div className="text-xs font-bold" style={{ color: rank.color }}>{rank.label}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{xp} XP total</div>
          </div>
        </div>
        {streak > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <Flame size={11} style={{ color: '#f97316' }} />
            <span className="text-xs font-bold" style={{ color: '#f97316' }}>{streak}</span>
          </div>
        )}
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden mb-1"
        style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)`,
          }}
        />
      </div>
      {reviewerRank !== 'master_examiner' && (
        <div className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
          {xpToNext} XP to next rank
        </div>
      )}

      {badges.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Award size={10} style={{ color: 'var(--text-muted)' }} />
          {badges.slice(0, 5).map((badge) => (
            <span
              key={badge.id}
              className="text-sm cursor-default"
              title={`${badge.name}: ${badge.description}`}
            >
              {badge.emoji}
            </span>
          ))}
          {badges.length > 5 && (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              +{badges.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GamificationBar;
