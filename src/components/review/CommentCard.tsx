import React, { useState } from 'react';
import type { InlineComment, ErrorCategory } from '../../types';
import { useStore } from '../../store/useStore';
import CharCounter from '../ui/CharCounter';
import { Pencil, Trash2, Check, X, Lightbulb } from 'lucide-react';

const MAX_COMMENT_CHARS = 3000;
const MAX_SUGGESTION_CHARS = 1500;

const CATEGORY_META: Record<ErrorCategory, { label: string; dot: string; bg: string; border: string; text: string }> = {
  grammar:     { label: 'Грамматика',          dot: '#dc2626', bg: 'rgba(220,38,38,0.08)',   border: 'rgba(220,38,38,0.25)',   text: '#f87171' },
  vocabulary:  { label: 'Словарный запас',      dot: '#d97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.25)',   text: '#fbbf24' },
  punctuation: { label: 'Пунктуация',           dot: '#b45309', bg: 'rgba(161,98,7,0.08)',    border: 'rgba(161,98,7,0.25)',    text: '#92400e' },
  style:       { label: 'Стиль и связность',    dot: '#7c3aed', bg: 'rgba(109,40,217,0.08)', border: 'rgba(109,40,217,0.25)', text: '#c084fc' },
  praise:      { label: 'Отличная мысль! 🌟',  dot: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.25)',  text: '#4ade80' },
};

interface CommentCardProps {
  comment: InlineComment;
  onClose: () => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment, onClose }) => {
  const { currentUser, updateInlineComment, deleteInlineComment } = useStore();
  const canEdit = comment.authorId === currentUser?.id;
  const [editing, setEditing] = useState(false);
  const [editComment, setEditComment] = useState(comment.comment);
  const [editSuggestion, setEditSuggestion] = useState(comment.suggestion || '');

  const meta = CATEGORY_META[comment.category];

  const handleSave = () => {
    updateInlineComment(comment.id, { comment: editComment.trim(), suggestion: editSuggestion.trim() || undefined });
    setEditing(false);
  };

  return (
    <div
      className="rounded-xl p-4 animate-fade-in"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${meta.border}`,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.text }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
          {meta.label}
        </div>
        <div className="flex items-center gap-1">
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="btn-ghost" style={{ padding: '5px' }}>
              <Pencil size={12} />
            </button>
          )}
          <button
            disabled={!canEdit}
            onClick={() => { deleteInlineComment(comment.id); onClose(); }}
            className="btn-ghost"
            style={{ padding: '5px', color: '#dc2626' }}
          >
            <Trash2 size={12} />
          </button>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '5px' }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Highlighted text */}
      <p className="text-xs italic mb-3" style={{ color: 'var(--text-muted)' }}>
        &ldquo;{comment.highlightedText}&rdquo;
      </p>

      {editing ? (
        <div className="space-y-2.5">
          <div>
            <textarea
              value={editComment}
              maxLength={MAX_COMMENT_CHARS}
              onChange={(e) => setEditComment(e.target.value.slice(0, MAX_COMMENT_CHARS))}
              className="textarea-field text-sm h-16"
              placeholder="Comment..."
            />
            <CharCounter value={editComment} max={MAX_COMMENT_CHARS} warnAt={600} />
          </div>

          <div>
            <textarea
              value={editSuggestion}
              maxLength={MAX_SUGGESTION_CHARS}
              onChange={(e) => setEditSuggestion(e.target.value.slice(0, MAX_SUGGESTION_CHARS))}
              className="textarea-field text-sm h-12"
              placeholder="Suggestion (optional)..."
            />
            <CharCounter value={editSuggestion} max={MAX_SUGGESTION_CHARS} warnAt={300} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs flex items-center gap-1">
              <X size={11} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editComment.trim() || editComment.length > MAX_COMMENT_CHARS}
              className="btn-primary text-xs"
            >
              <Check size={11} /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{comment.comment}</p>
          {comment.suggestion && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(161,98,7,0.08)', border: '1px solid rgba(161,98,7,0.20)' }}
            >
              <Lightbulb size={12} style={{ color: '#b45309', marginTop: 2, flexShrink: 0 }} />
              <p className="text-xs" style={{ color: '#92400e' }}>{comment.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentCard;
