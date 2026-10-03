import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import CharCounter from '../ui/CharCounter';

const MAX_FEEDBACK_CHARS = 3000;

type CriterionKey = 'taskResponse' | 'coherence' | 'lexicalResource' | 'grammar';

interface ChecklistItem {
  key: string;
  label: string;
}

interface CriteriaSectionProps {
  criterionKey: CriterionKey;
  title: string;
  icon: React.ReactNode;
  checklistItems: ChecklistItem[];
  feedbackPlaceholder: string;
  defaultOpen?: boolean;
}

function getBandColor(band: number): string {
  if (band >= 7) return '#16a34a';
  if (band >= 5) return '#b45309';
  return '#dc2626';
}

const CriteriaSection: React.FC<CriteriaSectionProps> = ({
  criterionKey, title, icon, checklistItems, feedbackPlaceholder, defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const { activeReview, updateReviewCriteria } = useStore();

  if (!activeReview) return null;
  const criteriaData = activeReview.criteria[criterionKey];
  const checkedCount = Object.values(criteriaData.checklistState).filter(Boolean).length;
  const bandColor = getBandColor(criteriaData.band);
  const sliderPct = ((criteriaData.band - 1) / 8) * 100;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--border)',
        boxShadow: open ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 transition-all"
        style={{ background: open ? 'var(--bg-card-2)' : 'var(--bg-card)' }}
      >
        <div
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: 'var(--bg-active)', border: '1px solid var(--border)' }}
        >
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Band {criteriaData.band.toFixed(1)} · {checkedCount}/{checklistItems.length} checks
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-lg font-black" style={{ color: bandColor }}>
            {criteriaData.band.toFixed(1)}
          </div>
          {open
            ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
          }
        </div>
      </button>

      {/* Body */}
      {open && (
        <div
          className="px-4 py-4 space-y-4 animate-fade-in"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          {/* Band slider */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="section-label">Band Score</span>
              <span className="text-2xl font-black" style={{ color: bandColor }}>
                {criteriaData.band.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={1} max={9} step={0.5}
              value={criteriaData.band}
              onChange={(e) => updateReviewCriteria(criterionKey, { band: parseFloat(e.target.value) })}
              className="w-full"
              style={{
                background: `linear-gradient(to right, ${bandColor} 0%, ${bandColor} ${sliderPct}%, var(--border-strong) ${sliderPct}%, var(--border-strong) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>1.0</span><span>5.0</span><span>9.0</span>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <p className="section-label mb-2">Quick Checklist</p>
            <div className="space-y-2">
              {checklistItems.map((item) => {
                const checked = criteriaData.checklistState[item.key];
                return (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={!!checked}
                    key={item.key}
                    className="w-full min-h-11 md:min-h-0 text-left flex items-center gap-2.5 cursor-pointer"
                    onClick={() =>
                      updateReviewCriteria(criterionKey, {
                        checklistState: { ...criteriaData.checklistState, [item.key]: !checked },
                      })
                    }
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: checked ? 'var(--accent)' : 'var(--bg-card-2)',
                        border: `1px solid ${checked ? 'var(--border-focus)' : 'var(--border-strong)'}`,
                        boxShadow: checked ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      {checked && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="var(--text-inverse)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-xs transition-all"
                      style={{
                        color: checked ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: checked ? 'line-through' : 'none',
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="section-label">Detailed Feedback</p>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {criteriaData.feedback.length} / {MAX_FEEDBACK_CHARS}
              </span>
            </div>
            <textarea
              value={criteriaData.feedback}
              maxLength={MAX_FEEDBACK_CHARS}
              onChange={(e) => updateReviewCriteria(criterionKey, { feedback: e.target.value.slice(0, MAX_FEEDBACK_CHARS) })}
              placeholder={feedbackPlaceholder}
              className="textarea-field text-sm h-28"
            />
            <CharCounter value={criteriaData.feedback} max={MAX_FEEDBACK_CHARS} warnAt={600} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaSection;
