import React, { useState, useCallback, useRef } from 'react';
import type { InlineComment, ErrorCategory } from '../../types';
import { useStore } from '../../store/useStore';
import FloatingTooltip from './FloatingTooltip';
import CommentCard from './CommentCard';
import { MessageSquare, Info, Sparkles } from 'lucide-react';

const CATEGORY_CLASS: Record<ErrorCategory, string> = {
  grammar: 'highlight-grammar',
  vocabulary: 'highlight-vocabulary',
  punctuation: 'highlight-punctuation',
  style: 'highlight-style',
  praise: 'highlight-praise',
};

interface EssayPanelProps {
  essayText: string;
}

/**
 * Standard TreeWalker helper to accurately calculate text character offset
 * within a DOM element even across multiple child spans and highlight elements.
 */
function getCaretOffsetWithin(element: Node, targetNode: Node, targetOffset: number): number {
  let caretOffset = 0;
  const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  while (treeWalker.nextNode()) {
    const current = treeWalker.currentNode;
    if (current === targetNode) {
      caretOffset += targetOffset;
      return caretOffset;
    }
    caretOffset += current.textContent?.length || 0;
  }
  return caretOffset;
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
          className={`${CATEGORY_CLASS[comment.category] || 'highlight-grammar'} ${activeId === comment.id ? 'ring-2 ring-blue-400 rounded' : ''}`}
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
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
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
      let absoluteEnd = -1;

      if (pElem) {
        const paraStart = Number(pElem.getAttribute('data-para-start')) || 0;
        const startOffsetInPara = getCaretOffsetWithin(pElem, range.startContainer, range.startOffset);
        const endOffsetInPara = getCaretOffsetWithin(pElem, range.endContainer, range.endOffset);
        absoluteStart = paraStart + startOffsetInPara;
        absoluteEnd = paraStart + endOffsetInPara;
      } else {
        const fullText = essayText;
        const idx = fullText.indexOf(selectedText);
        if (idx !== -1) {
          absoluteStart = idx;
          absoluteEnd = idx + selectedText.length;
        }
      }

      if (absoluteStart === -1 || absoluteEnd <= absoluteStart) return;

      const rect = range.getBoundingClientRect();
      // rect.left and rect.top are viewport-relative!
      // Since FloatingTooltip uses position: fixed, rect.top is the true Y coordinate.
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      setTooltip({
        x: Math.max(160, Math.min(window.innerWidth - 160, x)),
        y,
        text: selectedText,
        start: absoluteStart,
        end: absoluteEnd,
      });
    } catch (err) {
      console.warn('Selection processing error:', err);
    }
  }, [essayText]);

  const handleAddComment = useCallback((comment: Omit<InlineComment, 'id'>) => {
    addInlineComment({ ...comment, id: `ic-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    setTooltip(null);
  }, [addInlineComment]);

  // Split essay into paragraphs (by double newline or newline)
  const rawParagraphs = essayText.split(/\n\n+/).filter(Boolean);
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [essayText];

  const activeCommentData = comments.find((c) => c.id === activeCommentId);

  const fontSizeClass =
    fontSize === 'normal'
      ? 'text-sm sm:text-base leading-7 sm:leading-8'
      : fontSize === 'huge'
      ? 'text-lg sm:text-xl leading-8 sm:leading-10'
      : 'text-base sm:text-lg leading-7 sm:leading-9';

  return (
    <div className="flex flex-col h-full select-text" style={{ background: 'var(--bg)' }}>
      {/* Panel header with Font Size Controls & Stats */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            Текст эссе
            <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
              (выделите текст для добавления комментария)
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Font Size controls */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-xs text-slate-300">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded transition-colors ${fontSize === 'normal' ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20' : 'hover:text-white'}`}
              title="Стандартный шрифт"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded transition-colors text-xs font-semibold ${fontSize === 'large' ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20' : 'hover:text-white'}`}
              title="Крупный шрифт (удобно для чтения)"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('huge')}
              className={`px-2 py-1 rounded transition-colors text-sm font-bold ${fontSize === 'huge' ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20' : 'hover:text-white'}`}
              title="Максимальный шрифт"
            >
              A++
            </button>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              background: 'var(--bg-card-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} />
            {comments.length} <span className="hidden sm:inline">заметок</span>
          </div>
        </div>
      </div>

      {/* Legend with interactive sticker explanation */}
      <div
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-3 whitespace-nowrap text-xs">
          {[
            { label: '🔴 Грамматика',  dot: '#dc2626' },
            { label: '🟡 Лексика',     dot: '#d97706' },
            { label: '🔵 Стиль',       dot: '#7c3aed' },
            { label: '🟢 Отлично!',    dot: '#16a34a' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
              <span className="text-slate-400 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        <span className="text-[11px] text-blue-400 font-medium hidden lg:flex items-center gap-1">
          <Sparkles size={11} /> Выделите текст мышкой или пальцем
        </span>
      </div>

      {/* Essay text scrollable area */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 relative"
        onMouseUp={handleSelection}
        onTouchEnd={() => setTimeout(handleSelection, 200)}
        onClick={() => setActiveCommentId(null)}
        ref={containerRef}
      >
        <div className="max-w-3xl mx-auto space-y-5">
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
                  className={`select-text font-serif transition-all ${fontSizeClass}`}
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
            className="sticky bottom-4 max-w-sm mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs text-center pointer-events-none mt-8"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Info size={13} className="text-blue-400 flex-shrink-0" />
            <span>Выделите слово или фразу, чтобы прикрепить стикер проверки</span>
          </div>
        )}
      </div>

      {/* Active comment card view */}
      {activeCommentData && (
        <div
          className="flex-shrink-0 px-4 sm:px-6 py-3 animate-slide-up"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <CommentCard comment={activeCommentData} onClose={() => setActiveCommentId(null)} />
        </div>
      )}

      {/* Floating tooltip with quick sticker buttons */}
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
