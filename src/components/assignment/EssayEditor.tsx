import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Save, Send, AlertCircle, ShieldAlert, CheckCircle2,
  Zap, AlertTriangle, AlignLeft, Sparkles
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

  // Paragraph structure analysis (IELTS recommends 4 paragraphs: Intro, Body 1, Body 2, Conclusion)
  const rawParagraphs = essayText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const paraStats = rawParagraphs.map((p, idx) => {
    const pWords = p.split(/\s+/).filter(Boolean).length;
    let label = `Абзац ${idx + 1}`;
    let recommended = '60-90';
    if (idx === 0) { label = 'Введение (Intro)'; recommended = '35-50'; }
    else if (idx === 1) { label = 'Аргумент 1 (Body 1)'; recommended = '80-100'; }
    else if (idx === 2) { label = 'Аргумент 2 (Body 2)'; recommended = '80-100'; }
    else if (idx === 3) { label = 'Заключение (Conclusion)'; recommended = '30-45'; }
    return { label, words: pWords, recommended, idx };
  });

  // Honesty metrics state & refs
  const [secondsSpent, setSecondsSpent] = useState<number>(existingDraft?.timeSpentSeconds || 0);
  const [pasteAttempts, setPasteAttempts] = useState<number>(existingDraft?.pasteAttempts || 0);
  const [keystrokes, setKeystrokes] = useState<number>(existingDraft?.keystrokesCount || 0);

  const prevTextRef = useRef<string>(essayText);
  const lastActiveTimestamp = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stable callback refs so native listeners don't need re-registration
  const onPasteBlockedRef = useRef(onPasteBlocked);
  useEffect(() => { onPasteBlockedRef.current = onPasteBlocked; }, [onPasteBlocked]);

  // Sync prevTextRef when essayText changes externally
  useEffect(() => {
    prevTextRef.current = essayText;
  }, [essayText]);

  // ─────────────────────────────────────────────────────────────────────────
  // NATIVE DOM LEVEL PROTECTION (runs at capture phase, BEFORE React)
  // Catches: iOS contact autofill, Yank/kill-ring, spellcheck replacement,
  //          "Insert from iPhone" / vCard paste, OS-level text injection.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const BLOCKED_INPUT_TYPES = new Set([
      'insertFromPaste',
      'insertFromPasteAsQuotation',
      'insertFromYank',          // iOS kill-ring / yank buffer
      'insertFromDrop',
      'insertReplacementText',   // spellcheck / autocorrect bulk replacement
      'insertTranspose',
      'historyUndo',             // undo could restore pasted content
      'historyRedo',
    ]);

    // Block known paste-like input types at native beforeinput level
    const onNativeBeforeInput = (e: Event) => {
      const ie = e as InputEvent;
      if (BLOCKED_INPUT_TYPES.has(ie.inputType)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setPasteAttempts((p) => p + 1);
        onPasteBlockedRef.current();
      }
    };

    // Fallback delta guard — catches contact autofill via keyboard suggestion
    // bar, IME composition dumps, and anything that slips past beforeinput.
    const onNativeInput = () => {
      const current = el.value;
      const prev = prevTextRef.current;
      const delta = current.length - prev.length;

      if (delta > 5) {
        // Restore immediately at DOM level before React sees it
        el.value = prev;
        setPasteAttempts((p) => p + 1);
        onPasteBlockedRef.current();
      }
    };

    el.addEventListener('beforeinput', onNativeBeforeInput, { capture: true, passive: false });
    el.addEventListener('input',       onNativeInput,       { capture: true });

    return () => {
      el.removeEventListener('beforeinput', onNativeBeforeInput, { capture: true });
      el.removeEventListener('input',       onNativeInput,       { capture: true });
    };
  }, []);

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
          ref={textareaRef}
          value={essayText}
          onChange={handleTextChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          onBeforeInput={handleBeforeInput}
          maxLength={MAX_ESSAY_CHARS}
          rows={12}
          placeholder="Начните писать ваше эссе здесь... (Вставка текста заблокирована — пишите самостоятельно)"
          className="w-full rounded-xl p-3 sm:p-4 bg-slate-900/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 font-serif text-sm sm:text-base leading-relaxed focus:outline-none focus:border-violet-500 transition-all resize-y select-text"
          /* ──── Security attributes ──── */
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
        />

        {/* Security badge overlay */}
        <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-1.5 pointer-events-none text-[11px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700/60">
          <ShieldAlert size={12} className="text-violet-400" />
          <span>Анти-копипаст активен</span>
        </div>
      </div>

      {/* Paragraph Structure Breakdown (IELTS 4-Paragraph Analyzer) */}
      {rawParagraphs.length > 0 && (
        <div className="rounded-xl p-3 bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 flex-wrap gap-1">
            <span className="flex items-center gap-1.5 text-slate-200">
              <AlignLeft size={13} className="text-violet-400" />
              Структура эссе по абзацам ({rawParagraphs.length} {rawParagraphs.length === 4 ? 'из 4 — отлично!' : 'абз.'}):
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              IELTS стандарт: 4 абзаца
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {paraStats.map((st) => (
              <div
                key={st.idx}
                className={`p-2 rounded-lg border transition-all ${
                  st.idx === 3 && rawParagraphs.length === 4
                    ? 'bg-violet-950/20 border-violet-800/40'
                    : 'bg-slate-850/70 border-slate-800'
                }`}
              >
                <div className="text-[10px] font-medium text-slate-400 truncate">{st.label}</div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs font-bold text-white">
                    {st.words} <span className="font-normal text-[10px] text-slate-400">слов</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    рек. {st.recommended}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
