import React, { useState, useCallback } from 'react';
import type { Review, InlineComment, ErrorCategory } from '../../types';
import { X, ChevronDown, ChevronUp, GitCompare } from 'lucide-react';
import DiffModal from './DiffModal';

interface Props {
  essayContent: string;
  review: Review;
}

const CATEGORY_COLORS: Record<ErrorCategory, { bg: string; border: string; text: string; dot: string }> = {
  grammar:     { bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.35)',   text: '#b91c1c', dot: '#dc2626' },
  vocabulary:  { bg: 'rgba(37,99,235,0.10)',   border: 'rgba(37,99,235,0.35)',   text: '#1d4ed8', dot: '#2563eb' },
  punctuation: { bg: 'rgba(161,98,7,0.10)',    border: 'rgba(161,98,7,0.35)',    text: '#92400e', dot: '#b45309' },
  style:       { bg: 'rgba(109,40,217,0.10)',  border: 'rgba(109,40,217,0.35)',  text: '#6d28d9', dot: '#7c3aed' },
};

const HIGHLIGHT_CLASSES: Record<ErrorCategory, string> = {
  grammar:     'highlight-grammar',
  vocabulary:  'highlight-vocabulary',
  punctuation: 'highlight-punctuation',
  style:       'highlight-style',
};

function renderParagraph(
  paraText: string,
  paraStart: number,
  comments: InlineComment[],
  paraIdx: number,
  activeId: string | null,
  onClickHighlight: (id: string) => void
): React.ReactNode[] {
  const paraEnd = paraStart + paraText.length;
  const overlapping = comments
    .filter((c) => c.startIndex < paraEnd && c.endIndex > paraStart)
    .sort((a, b) => a.startIndex - b.startIndex);

  if (!overlapping.length) return [paraText];

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const comment of overlapping) {
    const relStart = Math.max(comment.startIndex - paraStart, 0);
    const relEnd = Math.min(comment.endIndex - paraStart, paraText.length);

    if (relStart > cursor) {
      nodes.push(
        <React.Fragment key={`plain-${paraIdx}-${cursor}`}>
          {paraText.slice(cursor, relStart)}
        </React.Fragment>
      );
    }
    if (relEnd > relStart) {
      const isActive = activeId === comment.id;
      nodes.push(
        <span
          key={comment.id}
          className={`${HIGHLIGHT_CLASSES[comment.category]} cursor-pointer transition-all`}
          style={{
            outline: isActive ? `2px solid ${CATEGORY_COLORS[comment.category].dot}` : undefined,
            outlineOffset: isActive ? '1px' : undefined,
            borderRadius: isActive ? '3px' : undefined,
          }}
          onClick={(e) => { e.stopPropagation(); onClickHighlight(comment.id); }}
          title={`${comment.category}: click to view comment`}
        >
          {paraText.slice(relStart, relEnd)}
        </span>
      );
    }
    cursor = Math.max(cursor, relEnd);
  }

  if (cursor < paraText.length) {
    nodes.push(
      <React.Fragment key={`plain-${paraIdx}-end`}>
        {paraText.slice(cursor)}
      </React.Fragment>
    );
  }

  return nodes;
}

const FeedbackViewer: React.FC<Props> = ({ essayContent, review }) => {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [diffComment, setDiffComment] = useState<InlineComment | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const comments = review.inlineComments;
  const activeComment = comments.find((c) => c.id === activeCommentId);

  const paragraphs = essayContent.split('\n\n').filter(Boolean);

  const handleHighlightClick = useCallback((id: string) => {
    setActiveCommentId((prev) => (prev === id ? null : id));
  }, []);

  const categoryCount = comments.reduce<Record<ErrorCategory, number>>(
    (acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; },
    { grammar: 0, vocabulary: 0, punctuation: 0, style: 0 }
  );

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Essay text panel */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ borderRight: sidebarOpen ? '1px solid var(--border)' : undefined }}
      >
        {/* Legend */}
        <div
          className="flex items-center gap-4 px-6 py-2.5 flex-shrink-0 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          {(Object.entries(CATEGORY_COLORS) as [ErrorCategory, (typeof CATEGORY_COLORS)[ErrorCategory]][]).map(([cat, cfg]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
              <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                {cat}
              </span>
              {categoryCount[cat] > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                >
                  {categoryCount[cat]}
                </span>
              )}
            </div>
          ))}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto btn-ghost text-xs flex items-center gap-1"
          >
            {sidebarOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {sidebarOpen ? 'Hide' : 'Show'} comments
          </button>
        </div>

        {/* Essay scroll area */}
        <div
          className="flex-1 overflow-y-auto px-8 py-6"
          onClick={() => setActiveCommentId(null)}
        >
          <div className="max-w-2xl mx-auto">
            {(() => {
              let charPos = 0;
              return paragraphs.map((para, pIdx) => {
                const paraStart = charPos;
                charPos += para.length + 2;
                return (
                  <p
                    key={pIdx}
                    className="mb-4 leading-8 font-serif text-base"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {renderParagraph(para, paraStart, comments, pIdx, activeCommentId, handleHighlightClick)}
                  </p>
                );
              });
            })()}
          </div>
        </div>

        {/* Active comment popup at bottom */}
        {activeComment && (
          <div
            className="flex-shrink-0 animate-slide-up"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
          >
            <div className="px-6 py-4">
              <div className="flex items-start gap-3">
                {/* Category badge */}
                <div
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                  style={{
                    background: CATEGORY_COLORS[activeComment.category].bg,
                    border: `1px solid ${CATEGORY_COLORS[activeComment.category].border}`,
                    color: CATEGORY_COLORS[activeComment.category].text,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: CATEGORY_COLORS[activeComment.category].dot }}
                  />
                  {activeComment.category}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs italic mb-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                    &ldquo;{activeComment.highlightedText}&rdquo;
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {activeComment.comment}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activeComment.suggestion && (
                    <button
                      onClick={() => setDiffComment(activeComment)}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                      style={{ padding: '5px 10px' }}
                    >
                      <GitCompare size={12} />
                      Compare
                    </button>
                  )}
                  <button
                    onClick={() => setActiveCommentId(null)}
                    className="btn-ghost"
                    style={{ padding: '5px' }}
                  >
                    <X size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comment list sidebar */}
      {sidebarOpen && (
        <div
          className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-card)' }}
        >
          <div
            className="px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Inline Comments
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {comments.length} annotation{comments.length !== 1 ? 's' : ''} — click to jump
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No inline comments in this review.
              </div>
            ) : (
              comments.map((comment, idx) => {
                const cfg = CATEGORY_COLORS[comment.category];
                const isActive = activeCommentId === comment.id;
                return (
                  <div
                    key={comment.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveCommentId(isActive ? null : comment.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveCommentId(isActive ? null : comment.id);
                      }
                    }}
                    className="w-full text-left px-4 py-3 transition-all cursor-pointer"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isActive ? cfg.bg : 'transparent',
                      borderLeft: `3px solid ${isActive ? cfg.dot : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                      >
                        {idx + 1} · {comment.category}
                      </span>
                      {comment.suggestion && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.25)' }}
                        >
                          has fix
                        </span>
                      )}
                    </div>
                    <p className="text-xs italic line-clamp-1 mb-1" style={{ color: 'var(--text-muted)' }}>
                      &ldquo;{comment.highlightedText}&rdquo;
                    </p>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {comment.comment}
                    </p>
                    {comment.suggestion && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDiffComment(comment); }}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: '#2563eb' }}
                      >
                        <GitCompare size={10} />
                        Compare with fix
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Diff modal */}
      {diffComment && (
        <DiffModal
          original={diffComment.highlightedText}
          suggestion={diffComment.suggestion || ''}
          comment={diffComment.comment}
          category={diffComment.category}
          onClose={() => setDiffComment(null)}
        />
      )}
    </div>
  );
};

export default FeedbackViewer;
