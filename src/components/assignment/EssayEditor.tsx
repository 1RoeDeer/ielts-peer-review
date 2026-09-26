import React from 'react';
import { Clock, Save, Send, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Assignment, Essay } from '../../types';

interface EssayEditorProps {
  assignment: Assignment;
  essayText: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  onOpenExamSimulator: () => void;
  existingDraft?: Essay | null;
  onPasteBlocked: () => void;
}

const MAX_ESSAY_CHARS = 3000;

export const EssayEditor: React.FC<EssayEditorProps> = ({
  assignment,
  essayText,
  onChangeText,
  onSubmit,
  onSaveDraft,
  onOpenExamSimulator,
  existingDraft,
  onPasteBlocked,
}) => {
  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const minWords = assignment.minWords;
  const charCount = essayText.length;
  const isMinMet = wordCount >= minWords;

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    onPasteBlocked();
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    onPasteBlocked();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      onPasteBlocked();
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header with Title and Mode Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/40">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Редактор эссе
            {existingDraft && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Черновик
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Набирайте текст вручную. По стандартам экзамена IELTS вставка из буфера обмена отключена.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenExamSimulator}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 transition-all self-start sm:self-auto"
        >
          <Clock size={14} className="text-violet-400" />
          Симулятор экзамена ({assignment.essayType === 'task1' ? '20м' : '40м'})
        </button>
      </div>

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          value={essayText}
          onChange={(e) => onChangeText(e.target.value.slice(0, MAX_ESSAY_CHARS))}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          maxLength={MAX_ESSAY_CHARS}
          rows={14}
          placeholder="Начните писать ваше эссе здесь... (Вставка текста отключена — пишите самостоятельно для тренировки скорости письма)"
          className="w-full rounded-xl p-4 bg-slate-900/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 font-serif text-base leading-relaxed focus:outline-none focus:border-violet-500 transition-all resize-y"
        />

        {/* Security badge overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700/50">
          <ShieldAlert size={12} className="text-violet-400" />
          <span>Защита от копипаста</span>
        </div>
      </div>

      {/* Counters & Validation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-400">Слов:</span>
            <span className={`font-bold ${isMinMet ? 'text-green-400' : 'text-amber-400'}`}>
              {wordCount}
            </span>
            <span className="text-slate-500">/ мин. {minWords}</span>
            {isMinMet && <CheckCircle2 size={13} className="text-green-400 ml-0.5" />}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Символов:</span>
            <span className="font-mono text-slate-300">{charCount}</span>
            <span className="text-slate-500">/ {MAX_ESSAY_CHARS}</span>
          </div>
        </div>

        {!isMinMet && (
          <div className="flex items-center gap-1.5 text-amber-300 text-xs">
            <AlertCircle size={13} />
            <span>Необходимо еще {minWords - wordCount} слов для отправки</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/30">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={!essayText.trim()}
          className="btn-secondary flex items-center gap-2 text-xs py-2.5 px-4"
        >
          <Save size={14} />
          Сохранить черновик
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!isMinMet || charCount > MAX_ESSAY_CHARS}
          className="btn-primary flex items-center gap-2 text-xs py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          Сдать на рецензирование
        </button>
      </div>
    </div>
  );
};

export default EssayEditor;
