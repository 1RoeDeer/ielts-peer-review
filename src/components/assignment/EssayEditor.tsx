import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Save, Send, AlertCircle, ShieldAlert, CheckCircle2,
  Zap, AlertTriangle
} from 'lucide-react';
import type { Assignment, Essay } from '../../types';

export interface SubmissionMetrics {
  timeSpentSeconds: number;
  keystrokesCount: number;
  pasteAttempts: number;
  averageWpm: number;
}

interface EssayEditorProps {
  assignment: Assignment;
  essayText: string;
  onChangeText: (text: string) => void;
  onSubmit: (metrics?: SubmissionMetrics) => void;
  onSaveDraft: () => void;
  onOpenExamSimulator: () => void;
  existingDraft?: Essay | null;
  onPasteBlocked: () => void;
}

const MAX_ESSAY_CHARS = 3000;
// Minimum seconds required if essay is at or above minimum word count (e.g. 250 words)
const MIN_WRITING_SECONDS_FOR_FULL_ESSAY = 120; // 2 minutes (125 WPM max threshold)

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

  // Honesty metrics state & refs
  const [secondsSpent, setSecondsSpent] = useState<number>(existingDraft?.timeSpentSeconds || 0);
  const [pasteAttempts, setPasteAttempts] = useState<number>(existingDraft?.pasteAttempts || 0);
  const [keystrokes, setKeystrokes] = useState<number>(existingDraft?.keystrokesCount || 0);

  const prevTextRef = useRef<string>(essayText);
  const lastActiveTimestamp = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync prevTextRef when essayText changes externally
  useEffect(() => {
    prevTextRef.current = essayText;
  }, [essayText]);

  // Active typing timer: increments only when user was active within last 25 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastActiveTimestamp.current < 25000) {
        setSecondsSpent((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const markActive = () => {
    lastActiveTimestamp.current = Date.now();
  };

  // Live words per minute
  const activeMinutes = secondsSpent > 0 ? secondsSpent / 60 : 0.01;
  const liveWpm = Math.round(wordCount / activeMinutes);

  // Too fast submission check (e.g. 250 words in less than 2 minutes)
  const isTooFast = isMinMet && secondsSpent < MIN_WRITING_SECONDS_FOR_FULL_ESSAY;
  const remainingSeconds = Math.max(0, MIN_WRITING_SECONDS_FOR_FULL_ESSAY - secondsSpent);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  /**
   * 🛡️ IRONCLAD ANTI-PASTE PROTECTION
   * 1. If length delta > 7 chars in a single event, it is 100% paste/insert -> REJECT.
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    markActive();
    const nextVal = e.target.value.slice(0, MAX_ESSAY_CHARS);
    const prevVal = prevTextRef.current;
    const addedChars = nextVal.length - prevVal.length;

    // Normal typing is 1 character (or 2-5 for mobile word auto-suggest).
    // Anything > 7 chars inserted in ONE synchronous change event is a clipboard dump.
    if (addedChars > 7) {
      setPasteAttempts((p) => p + 1);
      onPasteBlocked();
      // Reject change by restoring previous value
      onChangeText(prevVal);
      return;
    }

    prevTextRef.current = nextVal;
    onChangeText(nextVal);
  };

  // Block native desktop paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setPasteAttempts((p) => p + 1);
    onPasteBlocked();
  };

  // Block drag & drop of text
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setPasteAttempts((p) => p + 1);
    onPasteBlocked();
  };

  // Block mobile virtual keyboard paste / drag insertion via beforeinput
  const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement> & { inputType?: string }) => {
    if (
      e.inputType === 'insertFromPaste' ||
      e.inputType === 'insertFromDrop' ||
      e.inputType === 'insertReplacementText'
    ) {
      e.preventDefault();
      setPasteAttempts((p) => p + 1);
      onPasteBlocked();
    }
  };

  // Block keyboard shortcuts: Ctrl+V, Cmd+V, Shift+Insert
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    markActive();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      setPasteAttempts((p) => p + 1);
      onPasteBlocked();
      return;
    }
    if (e.shiftKey && e.key === 'Insert') {
      e.preventDefault();
      setPasteAttempts((p) => p + 1);
      onPasteBlocked();
      return;
    }

    // Increment keystrokes count (exclude standalone modifier keys)
    if (!['Control', 'Shift', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      setKeystrokes((k) => k + 1);
    }
  };

  // Block context menu (long press on mobile or right click on desktop)
  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    onPasteBlocked();
  };

  const handleFinalSubmit = () => {
    if (isTooFast || !isMinMet) return;
    onSubmit({
      timeSpentSeconds: secondsSpent,
      keystrokesCount: keystrokes,
      pasteAttempts,
      averageWpm: liveWpm,
    });
  };

  return (
    <div className="glass-card p-4 sm:p-6 space-y-4">
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
            Набирайте текст вручную. По стандартам экзамена IELTS вставка из буфера обмена заблокирована.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenExamSimulator}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 transition-all self-start sm:self-auto"
        >
          <Clock size={14} className="text-violet-400" />
          Симулятор ({assignment.essayType === 'task1' ? '20м' : '40м'})
        </button>
      </div>

      {/* Live Honesty & Pace Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Clock size={13} className="text-violet-400" />
            <span>Время: <strong className="text-white">{formatTime(secondsSpent)}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Zap size={13} className="text-amber-400" />
            <span>Темп: <strong className="text-white">{liveWpm}</strong> сл/мин</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pasteAttempts > 0 ? (
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
              <AlertTriangle size={11} /> Вставок заблокировано: {pasteAttempts}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 size={11} /> 100% ручной ввод
            </span>
          )}
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          value={essayText}
          onChange={handleTextChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          onBeforeInput={handleBeforeInput}
          maxLength={MAX_ESSAY_CHARS}
          rows={12}
          placeholder="Начните писать ваше эссе здесь... (Вставка текста с клавиатуры или буфера заблокирована — пишите самостоятельно)"
          className="w-full rounded-xl p-3 sm:p-4 bg-slate-900/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 font-serif text-sm sm:text-base leading-relaxed focus:outline-none focus:border-violet-500 transition-all resize-y select-text"
        />

        {/* Security badge overlay */}
        <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-1.5 pointer-events-none text-[11px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700/60">
          <ShieldAlert size={12} className="text-violet-400" />
          <span>Анти-копипаст активен</span>
        </div>
      </div>

      {/* Counters & Validation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
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
            <span>Необходимо еще {minWords - wordCount} слов для сдачи</span>
          </div>
        )}

        {isTooFast && (
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[11px]">
            <Clock size={12} />
            <span>Слишком быстрая сдача. Мин. время: 2 мин (осталось {remainingSeconds}с)</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-700/30 flex-wrap">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={!essayText.trim()}
          className="btn-secondary flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs py-2.5 px-4"
        >
          <Save size={14} />
          Сохранить черновик
        </button>

        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={!isMinMet || charCount > MAX_ESSAY_CHARS || isTooFast}
          className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isTooFast ? `Минимальное время написания: 2 мин` : undefined}
        >
          <Send size={14} />
          Сдать на рецензирование
        </button>
      </div>
    </div>
  );
};

export default EssayEditor;
