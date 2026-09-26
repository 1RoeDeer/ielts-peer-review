import React, { useState } from 'react';
import type { ModelEssay, AnnotationHighlight, AnnotationType } from '../../types';
import { BookOpen, Sparkles, ChevronDown, ChevronRight, Info, Tag } from 'lucide-react';

interface Props {
  essay: ModelEssay;
}

const ANNOTATION_COLORS: Record<AnnotationType, { bg: string; border: string; text: string; dot: string; label: string }> = {
  structure:  { bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.30)', text: '#6d28d9', dot: '#7c3aed',  label: '🔥 Advanced Structure' },
  vocabulary: { bg: 'rgba(37,99,235,0.10)',  border: 'rgba(37,99,235,0.30)',  text: '#1d4ed8', dot: '#2563eb',  label: '📖 Vocabulary' },
  grammar:    { bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.30)',  text: '#b91c1c', dot: '#dc2626',  label: '🔤 Grammar' },
  cohesion:   { bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.30)',  text: '#15803d', dot: '#16a34a',  label: '🔗 Cohesion' },
  task:       { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', text: '#b45309', dot: '#f59e0b',  label: '📌 Task Achievement' },
};

function renderAnnotatedText(
  content: string,
  annotations: AnnotationHighlight[],
  activeId: number | null,
  onClickAnnotation: (idx: number) => void
): React.ReactNode {
  const paragraphs = content.split('\n\n').filter(Boolean);
  let charPos = 0;

  return (
    <>
      {paragraphs.map((para, pIdx) => {
        const paraStart = charPos;
        const paraEnd = paraStart + para.length;
        charPos += para.length + 2;

        const overlapping = annotations
          .map((a, idx) => ({ ...a, idx }))
          .filter((a) => a.startIndex < paraEnd && a.endIndex > paraStart)
          .sort((a, b) => a.startIndex - b.startIndex);

        if (!overlapping.length) {
          return (
            <p key={pIdx} className="mb-4 leading-8 font-serif text-base" style={{ color: 'var(--text-primary)' }}>
              {para}
            </p>
          );
        }

        const nodes: React.ReactNode[] = [];
        let cursor = 0;

        for (const ann of overlapping) {
          const relStart = Math.max(ann.startIndex - paraStart, 0);
          const relEnd = Math.min(ann.endIndex - paraStart, para.length);

          if (relStart > cursor) {
            nodes.push(<React.Fragment key={`p${pIdx}-plain-${cursor}`}>{para.slice(cursor, relStart)}</React.Fragment>);
          }
          if (relEnd > relStart) {
            const cfg = ANNOTATION_COLORS[ann.type];
            const isActive = activeId === ann.idx;
            nodes.push(
              <span
                key={`ann-${ann.idx}`}
                className="cursor-pointer rounded px-0.5 transition-all"
                style={{
                  background: cfg.bg,
                  borderBottom: `2px solid ${cfg.dot}`,
                  color: 'var(--text-primary)',
                  boxShadow: isActive ? `0 0 0 2px ${cfg.dot}44` : undefined,
                }}
                onClick={() => onClickAnnotation(ann.idx)}
                title={`${cfg.label} — click to learn more`}
              >
                {para.slice(relStart, relEnd)}
              </span>
            );
          }
          cursor = Math.max(cursor, relEnd);
        }

        if (cursor < para.length) {
          nodes.push(<React.Fragment key={`p${pIdx}-plain-end`}>{para.slice(cursor)}</React.Fragment>);
        }

        return (
          <p key={pIdx} className="mb-4 leading-8 font-serif text-base" style={{ color: 'var(--text-primary)' }}>
            {nodes}
          </p>
        );
      })}
    </>
  );
}

const ModelEssayPanel: React.FC<Props> = ({ essay }) => {
  const [activeAnnotationIdx, setActiveAnnotationIdx] = useState<number | null>(null);
  const [showStructures, setShowStructures] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);

  const activeAnnotation = activeAnnotationIdx !== null ? essay.annotations[activeAnnotationIdx] : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Teacher notes banner */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(22,163,74,0.06)',
          border: '1px solid rgba(22,163,74,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: '#16a34a' }} />
          <span className="text-sm font-bold" style={{ color: '#16a34a' }}>
            Examiner Notes — Band {essay.bandScore.toFixed(1)}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {essay.teacherNotes}
        </p>
      </div>

      {/* Annotation legend */}
      <div
        className="rounded-xl p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="section-label mb-2 flex items-center gap-1.5">
          <Info size={11} />
          Annotation Legend — Click highlighted text to learn
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(ANNOTATION_COLORS) as [AnnotationType, (typeof ANNOTATION_COLORS)[AnnotationType]][]).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
              <span style={{ color: 'var(--text-muted)' }}>{cfg.label.replace(/^[^\s]+\s/, '')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Essay text with annotations */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card-2)' }}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Band {essay.bandScore.toFixed(1)} Model Essay
            </span>
          </div>
          <div
            className="text-xs px-2.5 py-1 rounded-full font-bold"
            style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)' }}
          >
            ✓ {essay.annotations.length} expert annotations
          </div>
        </div>

        <div className="px-8 py-6">
          {renderAnnotatedText(essay.content, essay.annotations, activeAnnotationIdx, (idx) =>
            setActiveAnnotationIdx((prev) => (prev === idx ? null : idx))
          )}
        </div>

        {/* Active annotation popup */}
        {activeAnnotation && (
          <div
            className="px-5 py-4 animate-slide-up"
            style={{
              borderTop: '1px solid var(--border)',
              background: ANNOTATION_COLORS[activeAnnotation.type].bg,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${ANNOTATION_COLORS[activeAnnotation.type].border}`,
                  color: ANNOTATION_COLORS[activeAnnotation.type].text,
                }}
              >
                {ANNOTATION_COLORS[activeAnnotation.type].label}
              </div>
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-primary)' }}>
                {activeAnnotation.note}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Grammar Structures */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setShowStructures(!showStructures)}
          className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Band 9 Grammatical Structures Used ({essay.structures.length})
            </span>
          </div>
          {showStructures ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
        </button>
        {showStructures && (
          <div className="px-5 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="pt-3" />
            {essay.structures.map((s, idx) => (
              <div
                key={idx}
                className="rounded-xl p-4"
                style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}
              >
                <div className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  {s.name}
                </div>
                <div
                  className="text-sm italic px-3 py-2 rounded-lg mb-2 font-serif"
                  style={{
                    background: 'rgba(124,58,237,0.06)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    color: '#6d28d9',
                  }}
                >
                  &ldquo;{s.example}&rdquo;
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {s.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Academic Phrases */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setShowPhrases(!showPhrases)}
          className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div className="flex items-center gap-2">
            <Tag size={14} style={{ color: '#2563eb' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Key Academic Phrases to Steal ({essay.keyPhrases.length})
            </span>
          </div>
          {showPhrases ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
        </button>
        {showPhrases && (
          <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="pt-3 flex flex-wrap gap-2">
              {essay.keyPhrases.map((phrase, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1.5 rounded-full font-medium italic"
                  style={{
                    background: 'rgba(37,99,235,0.08)',
                    border: '1px solid rgba(37,99,235,0.2)',
                    color: '#1d4ed8',
                  }}
                >
                  &ldquo;{phrase}&rdquo;
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelEssayPanel;
