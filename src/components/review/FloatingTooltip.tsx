import React, { useState } from 'react';
import type { ErrorCategory, InlineComment } from '../../types';
import { Check, Lightbulb, X, PenLine } from 'lucide-react';
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
  emoji: string;
  label: string;
  shortLabel: string;
  dot: string;
  bg: string;
  bgHover: string;
  text: string;
  border: string;
  defaultComment: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    value: 'grammar',
    emoji: '🔴',
    label: 'Грамматика',
    shortLabel: 'Грамматика',
    dot: '#dc2626',
    bg: 'rgba(220,38,38,0.10)',
    bgHover: 'rgba(220,38,38,0.20)',
    text: '#f87171',
    border: 'rgba(220,38,38,0.35)',
    defaultComment: 'Здесь есть грамматическая ошибка. Обрати внимание!',
  },
  {
    value: 'vocabulary',
    emoji: '🟡',
    label: 'Словарный запас',
    shortLabel: 'Лексика',
    dot: '#d97706',
    bg: 'rgba(217,119,6,0.10)',
    bgHover: 'rgba(217,119,6,0.20)',
    text: '#fbbf24',
    border: 'rgba(217,119,6,0.35)',
    defaultComment: 'Попробуй использовать более разнообразную лексику здесь.',
  },
  {
    value: 'style',
    emoji: '🔵',
    label: 'Стиль / Связность',
    shortLabel: 'Стиль',
    dot: '#7c3aed',
    bg: 'rgba(109,40,217,0.10)',
    bgHover: 'rgba(109,40,217,0.20)',
    text: '#c084fc',
    border: 'rgba(109,40,217,0.35)',
    defaultComment: 'Поработай над связностью и стилем в этом предложении.',
  },
  {
    value: 'praise',
    emoji: '🟢',
    label: 'Отличная мысль!',
    shortLabel: 'Хорошо!',
    dot: '#16a34a',
    bg: 'rgba(22,163,74,0.10)',
    bgHover: 'rgba(22,163,74,0.20)',
    text: '#4ade80',
    border: 'rgba(22,163,74,0.35)',
    defaultComment: 'Отличная мысль! 🌟 Хорошо сформулировано.',
  },
];

const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
  position, selectedText, startIndex, endIndex, onAdd, onClose,
}) => {
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [category, setCategory] = useState<ErrorCategory | null>(null);
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const selectedCat = CATEGORIES.find((c) => c.value === category);

  /** Quick one-tap sticker — uses default comment text */
  const handleQuickAdd = (cat: CategoryDef) => {
    onAdd({
      startIndex,
      endIndex,
      highlightedText: selectedText,
      category: cat.value,
      comment: cat.defaultComment,
      suggestion: undefined,
    });
    onClose();
  };

  /** Full form add */
  const handleFullAdd = () => {
    if (!category || !comment.trim() || comment.length > COMMENT_MAX) return;
    onAdd({
      startIndex,
      endIndex,
      highlightedText: selectedText,
      category,
      comment: comment.trim(),
      suggestion: suggestion.trim() || undefined,
    });
    onClose();
  };

  const openFull = (cat?: CategoryDef) => {
    if (cat) {
      setCategory(cat.value);
      setComment('');
    }
    setMode('full');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isNearTop = !isMobile && position.y < 280;

  const tooltipStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        left: '12px',
        right: '12px',
        zIndex: 100,
        maxWidth: '420px',
        margin: '0 auto',
      }
    : {
        position: 'fixed',
        left: Math.max(180, Math.min(window.innerWidth - 180, position.x)),
        top: isNearTop ? Math.max(16, position.y + 16) : Math.max(16, position.y - 12),
        transform: isNearTop ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
        zIndex: 100,
      };

  return (
    <div className="animate-scale-in" style={tooltipStyle}>
      <div
        className="w-full sm:w-72 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Selected text preview */}
        <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs italic line-clamp-2 text-slate-400">
            &ldquo;{selectedText.length > 60 ? selectedText.slice(0, 60) + '…' : selectedText}&rdquo;
          </p>
        </div>

        {mode === 'quick' ? (
          <div className="p-3 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              Выбери тип комментария
            </p>

            {/* Quick sticker buttons */}
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleQuickAdd(cat)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: cat.bg,
                    border: `1px solid ${cat.border}`,
                    color: cat.text,
                  }}
                >
                  <span className="text-base leading-none">{cat.emoji}</span>
                  <span className="text-left leading-tight">{cat.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Full comment option */}
            <button
              onClick={() => openFull()}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all border border-dashed border-slate-700/60"
            >
              <PenLine size={12} />
              Написать подробный комментарий
            </button>

            <button onClick={onClose} className="w-full text-center text-[11px] text-slate-600 hover:text-slate-400 py-1 transition-colors">
              Отмена
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Category picker */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Категория</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: category === cat.value ? cat.bg : 'transparent',
                      border: `1px solid ${category === cat.value ? cat.border : 'var(--border)'}`,
                      color: category === cat.value ? cat.text : 'var(--text-muted)',
                    }}
                  >
                    <span>{cat.emoji}</span>
                    {cat.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment textarea */}
            <div>
              <label className="section-label block mb-1.5">Комментарий</label>
              <textarea
                autoFocus
                value={comment}
                maxLength={COMMENT_MAX}
                onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
                placeholder={selectedCat?.defaultComment || 'Опиши проблему...'}
                className="textarea-field text-sm h-20"
              />
              <CharCounter value={comment} max={COMMENT_MAX} warnAt={500} />
            </div>

            {/* Suggestion */}
            <div>
              <label className="section-label flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={11} style={{ color: '#b45309' }} />
                Предложение по исправлению (необязательно)
              </label>
              <textarea
                value={suggestion}
                maxLength={SUGGESTION_MAX}
                onChange={(e) => setSuggestion(e.target.value.slice(0, SUGGESTION_MAX))}
                placeholder="Как лучше написать?"
                className="textarea-field text-sm h-12"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setMode('quick')} className="btn-ghost flex items-center gap-1 text-xs">
                <X size={11} /> Назад
              </button>
              <button
                onClick={handleFullAdd}
                disabled={!category || !comment.trim() || comment.length > COMMENT_MAX}
                className="btn-primary flex-1 justify-center text-xs"
              >
                <Check size={12} />
                Добавить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Arrow tip (desktop only) */}
      {!isMobile && (
        <div className={`flex justify-center ${isNearTop ? '-order-1 -mb-1.5' : '-mt-1.5'}`}>
          <div
            className={`w-3 h-3 transform rotate-45 ${isNearTop ? 'border-t border-l' : 'border-r border-b'}`}
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-strong)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FloatingTooltip;
