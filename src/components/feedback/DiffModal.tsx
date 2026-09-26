import React from 'react';
import type { ErrorCategory } from '../../types';
import { X, ArrowRight } from 'lucide-react';

interface Props {
  original: string;
  suggestion: string;
  comment: string;
  category: ErrorCategory;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<ErrorCategory, { bg: string; border: string; text: string; dot: string; label: string }> = {
  grammar:     { bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.35)',   text: '#b91c1c', dot: '#dc2626',  label: 'Grammar' },
  vocabulary:  { bg: 'rgba(37,99,235,0.10)',   border: 'rgba(37,99,235,0.35)',   text: '#1d4ed8', dot: '#2563eb',  label: 'Vocabulary' },
  punctuation: { bg: 'rgba(161,98,7,0.10)',    border: 'rgba(161,98,7,0.35)',    text: '#92400e', dot: '#b45309',  label: 'Punctuation' },
  style:       { bg: 'rgba(109,40,217,0.10)',  border: 'rgba(109,40,217,0.35)',  text: '#6d28d9', dot: '#7c3aed',  label: 'Style & Cohesion' },
};

const DiffModal: React.FC<Props> = ({ original, suggestion, comment, category, onClose }) => {
  const cfg = CATEGORY_COLORS[category];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
              {cfg.label}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Suggested Correction
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={15} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Comment */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card-2)' }}>
          <div className="section-label mb-1">Reviewer's Comment</div>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{comment}</p>
        </div>

        {/* Diff comparison */}
        <div className="px-5 py-4 space-y-3">
          <div className="section-label mb-3">Text Comparison</div>

          {/* Original */}
          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: '#dc2626' }}>
              ✗ Original
            </div>
            <div
              className="px-4 py-3 rounded-xl text-sm leading-relaxed font-serif"
              style={{
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.25)',
                color: 'var(--text-primary)',
                textDecoration: 'line-through',
                textDecorationColor: 'rgba(220,38,38,0.5)',
              }}
            >
              {original}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <ArrowRight size={12} />
              suggested correction
            </div>
          </div>

          {/* Suggestion */}
          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: '#16a34a' }}>
              ✓ Suggested
            </div>
            <div
              className="px-4 py-3 rounded-xl text-sm leading-relaxed font-serif"
              style={{
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.25)',
                color: 'var(--text-primary)',
              }}
            >
              {suggestion}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex justify-end"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card-2)' }}
        >
          <button onClick={onClose} className="btn-primary text-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffModal;
