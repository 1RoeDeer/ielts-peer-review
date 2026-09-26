import React, { useState } from 'react';
import type { ErrorCategory, InlineComment } from '../../types';
import { Check, Lightbulb, AlertCircle } from 'lucide-react';
import CharCounter from '../ui/CharCounter';

const COMMENT_MAX = 3000;
const SUGGESTION_MAX = 1500;

interface FloatingTooltipProps {
  position: { x: number; y: number };
  selectedText: string;
  startIndex: number;
  endIndex: number;
  onAdd: (comment: Omit<InlineComment, 'id'>) => void;
  onClose: () => void;
}

interface CategoryDef {
  value: ErrorCategory;
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    value: 'grammar',
    label: 'Grammar',
    dot: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    text: '#b91c1c',
    border: 'rgba(220,38,38,0.25)',
  },
  {
    value: 'vocabulary',
    label: 'Vocabulary',
    dot: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    text: '#1d4ed8',
    border: 'rgba(37,99,235,0.25)',
  },
  {
    value: 'punctuation',
    label: 'Punctuation',
    dot: '#b45309',
    bg: 'rgba(161,98,7,0.08)',
    text: '#92400e',
    border: 'rgba(161,98,7,0.25)',
  },
  {
    value: 'style',
    label: 'Style & Cohesion',
    dot: '#7c3aed',
    bg: 'rgba(109,40,217,0.08)',
    text: '#6d28d9',
    border: 'rgba(109,40,217,0.25)',
  },
];

const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
  position, selectedText, startIndex, endIndex, onAdd, onClose,
}) => {
  const [category, setCategory] = useState<ErrorCategory | null>(null);
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [step, setStep] = useState<'category' | 'detail'>('category');

  const selectedCat = CATEGORIES.find((c) => c.value === category);

  const handleAdd = () => {
    if (!category || !comment.trim() || comment.length > COMMENT_MAX) return;
    onAdd({ startIndex, endIndex, highlightedText: selectedText, category, comment: comment.trim(), suggestion: suggestion.trim() || undefined });
    onClose();
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const tooltipStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: '20px',
        left: '12px',
        right: '12px',
        zIndex: 100,
        maxWidth: '420px',
        margin: '0 auto',
      }
    : {
        position: 'fixed',
        left: Math.max(170, Math.min(window.innerWidth - 170, position.x)),
        top: Math.max(10, position.y - 8),
        transform: 'translateX(-50%) translateY(-100%)',
        zIndex: 50,
      };

  return (
    <div
      className="animate-scale-in"
      style={tooltipStyle}
    >
      <div
        className="w-full sm:w-80 rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Selected text preview */}
        <div
          className="px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={13} style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }} />
            <p className="text-xs italic line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              &ldquo;{selectedText}&rdquo;
            </p>
          </div>
        </div>

        {step === 'category' ? (
          <div className="p-4">
            <p className="section-label mb-3">Select error category</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setStep('detail'); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: cat.bg,
                    border: `1px solid ${cat.border}`,
                    color: cat.text,
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.dot }} />
                  {cat.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="btn-ghost w-full mt-3 justify-center text-xs">
              Cancel
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Category indicator */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: selectedCat?.bg,
                  border: `1px solid ${selectedCat?.border}`,
                  color: selectedCat?.text,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: selectedCat?.dot }} />
                {selectedCat?.label}
              </div>
              <button
                onClick={() => setStep('category')}
                className="text-xs btn-ghost"
                style={{ padding: '4px 8px' }}
              >
                Change
              </button>
            </div>

            {/* Comment */}
            <div>
              <label className="section-label block mb-1.5">Comment</label>
              <textarea
                autoFocus
                value={comment}
                maxLength={COMMENT_MAX}
                onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
                placeholder="Describe the issue..."
                className="textarea-field text-sm h-20"
              />
              <CharCounter value={comment} max={COMMENT_MAX} warnAt={500} />
            </div>

            {/* Suggestion */}
            <div>
              <label className="section-label flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={11} style={{ color: '#b45309' }} />
                Suggestion (optional)
              </label>
              <textarea
                value={suggestion}
                maxLength={SUGGESTION_MAX}
                onChange={(e) => setSuggestion(e.target.value.slice(0, SUGGESTION_MAX))}
                placeholder="Proposed correction..."
                className="textarea-field text-sm h-14"
              />
              <CharCounter value={suggestion} max={SUGGESTION_MAX} warnAt={300} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!comment.trim() || comment.length > COMMENT_MAX}
                className="btn-primary flex-1 justify-center text-xs"
              >
                <Check size={12} />
                Add Comment
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Arrow tip (desktop only) */}
      {!isMobile && (
        <div className="flex justify-center">
          <div
            className="w-3 h-3 -mt-1.5 transform rotate-45"
            style={{
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border-strong)',
              borderBottom: '1px solid var(--border-strong)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FloatingTooltip;
