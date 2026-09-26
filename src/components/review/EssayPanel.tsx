import React, { useState, useCallback, useRef } from 'react';
import type { InlineComment, ErrorCategory } from '../../types';
import { useStore } from '../../store/useStore';
import FloatingTooltip from './FloatingTooltip';
import CommentCard from './CommentCard';
import { MessageSquare, Info } from 'lucide-react';

const CATEGORY_CLASS: Record<ErrorCategory, string> = {
  grammar: 'highlight-grammar',
  vocabulary: 'highlight-vocabulary',
  punctuation: 'highlight-punctuation',
  style: 'highlight-style',
};

interface EssayPanelProps {
  essayText: string;
}

/**
 * Renders a paragraph of text with inline highlight spans.
 * Comments are sorted and filtered to only those overlapping [paraStart, paraEnd).
 */
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
      nodes.push(<React.Fragment key={`plain-${paraIdx}-${cursor}`}>{paraText.slice(cursor, relStart)}</React.Fragment>);
    }
    if (relEnd > relStart) {
      nodes.push(
        <span
          key={comment.id}
          className={`${CATEGORY_CLASS[comment.category]} ${activeId === comment.id ? 'ring-1 ring-white/20' : ''}`}
          onClick={(e) => { e.stopPropagation(); onClickHighlight(comment.id); }}
        >
          {paraText.slice(relStart, relEnd)}
        </span>
      );
    }
    cursor = Math.max(cursor, relEnd);
  }

  if (cursor < paraText.length) {
    nodes.push(<React.Fragment key={`plain-${paraIdx}-end`}>{paraText.slice(cursor)}</React.Fragment>);
  }

  return nodes;
}

const EssayPanel: React.FC<EssayPanelProps> = ({ essayText }) => {
  const { activeReview, addInlineComment } = useStore();
  const comments = activeReview?.inlineComments || [];

  const [tooltip, setTooltip] = useState<{
    x: number; y: number; text: string; start: number; end: number;
  } | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    try {
      const range = selection.getRangeAt(0);
      const startNode = range.startContainer;
      const pElem = (startNode.nodeType === Node.ELEMENT_NODE ? (startNode as HTMLElement) : startNode.parentElement)?.closest('[data-para-idx]');

      let absoluteStart = -1;
      if (pElem) {
        const paraStart = Number(pElem.getAttribute('data-para-start')) || 0;
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(pElem);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const offsetInPara = preCaretRange.toString().length;
        absoluteStart = paraStart + offsetInPara;
      } else {
        const fullText = essayText;
        const idx = fullText.indexOf(selectedText);
        if (idx !== -1) absoluteStart = idx;
      }

      if (absoluteStart === -1) return;

      const rect = range.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + window.scrollY;

      setTooltip({
        x: Math.max(160, Math.min(window.innerWidth - 160, x)),
        y,
        text: selectedText,
        start: absoluteStart,
        end: absoluteStart + selectedText.length,
      });
    } catch (err) {
      console.warn('Selection processing error:', err);
    }
  }, [essayText]);

  const handleAddComment = useCallback((comment: Omit<InlineComment, 'id'>) => {
    addInlineComment({ ...comment, id: `ic-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    setTooltip(null);
  }, [addInlineComment]);

  // Split essay into paragraphs (by double newline)
  const paragraphs = essayText.split('\n\n').filter(Boolean);

  const activeCommentData = comments.find((c) => c.id === activeCommentId);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Essay Text</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Select any text to add an inline comment</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: 'var(--bg-card-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} />
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-4 px-6 py-2 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        {[
          { label: 'Grammar',     dot: '#dc2626' },
          { label: 'Vocabulary',  dot: '#2563eb' },
          { label: 'Punctuation', dot: '#b45309' },
          { label: 'Style',       dot: '#7c3aed' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Essay text area */}
      <div
        className="flex-1 overflow-y-auto px-8 py-6 relative"
        onMouseUp={handleSelection}
        onTouchEnd={() => setTimeout(handleSelection, 200)}
        onClick={() => setActiveCommentId(null)}
        ref={containerRef}
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
                  data-para-idx={pIdx}
                  data-para-start={paraStart}
                  className="mb-4 leading-8 select-text font-serif text-base"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {renderParagraph(para, paraStart, comments, pIdx, activeCommentId, (id) =>
                    setActiveCommentId((prev) => (prev === id ? null : id))
                  )}
                </p>
              );
            });
          })()}
        </div>

        {comments.length === 0 && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs pointer-events-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <Info size={12} />
            Select text to add your first comment
          </div>
        )}
      </div>

      {/* Active comment card */}
      {activeCommentData && (
        <div
          className="flex-shrink-0 px-6 py-4 animate-slide-up"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <CommentCard comment={activeCommentData} onClose={() => setActiveCommentId(null)} />
        </div>
      )}

      {/* Floating tooltip */}
      {tooltip && (
        <FloatingTooltip
          position={{ x: tooltip.x, y: tooltip.y }}
          selectedText={tooltip.text}
          startIndex={tooltip.start}
          endIndex={tooltip.end}
          onAdd={handleAddComment}
          onClose={() => setTooltip(null)}
        />
      )}
    </div>
  );
};

export default EssayPanel;
