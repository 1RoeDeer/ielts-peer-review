import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, AlertTriangle, ShieldAlert, ShieldCheck, Play, Pause,
  X, CheckCircle2, Send, Minimize2, BookOpen, AlertCircle, FileText
} from 'lucide-react';
import type { Assignment } from '../../types';

interface ExamSimulatorModalProps {
  assignment: Assignment;
  initialText: string;
  onSaveAndExit: (text: string) => void;
  onSubmitExam: (text: string, timeSpentSeconds: number) => void;
}

const MAX_ESSAY_CHARS = 3000;

export const ExamSimulatorModal: React.FC<ExamSimulatorModalProps> = ({
  assignment,
  initialText,
  onSaveAndExit,
  onSubmitExam,
}) => {
  const isTask1 = assignment.essayType === 'task1';
  const totalSeconds = isTask1 ? 20 * 60 : 40 * 60; // 20m for Task 1, 40m for Task 2

  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [text, setText] = useState<string>(initialText);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState<number>(0);
  const [lastWarningMsg, setLastWarningMsg] = useState<string | null>(null);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState<boolean>(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = assignment.minWords;
  const charCount = text.length;

  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerWarning = (msg: string) => {
    setLastWarningMsg(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => {
      setLastWarningMsg(null);
    }, 5000);
  };

  // Timer countdown
  useEffect(() => {
    if (isPaused || showExitConfirm || isAutoSubmitting) return;

    if (timeLeft <= 0) {
      handleTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, showExitConfirm, isAutoSubmitting]);

  // Tab switch / anti-cheat listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isPaused && !isAutoSubmitting && !showExitConfirm) {
        setTabSwitchWarnings((prev) => {
          const next = prev + 1;
          triggerWarning(`⚠️ Потеря фокуса окна экзамена! Переключение вкладок #${next} зафиксировано.`);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPaused, isAutoSubmitting, showExitConfirm]);

  // Cleanup warning timeout
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  const handleTimeExpired = () => {
    setIsAutoSubmitting(true);
    triggerWarning('⏱️ Время истекло! Автоматическая отправка эссе на рецензирование...');
    setTimeout(() => {
      onSubmitExam(text.slice(0, MAX_ESSAY_CHARS).trim(), totalSeconds);
    }, 2500);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    triggerWarning('🚫 Вставка текста заблокирована! Эссе необходимо набирать вручную для тренировки скорости и моторики.');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    triggerWarning('🚫 Перетаскивание текста заблокировано!');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      triggerWarning('🚫 Вставка текста (Ctrl+V) заблокирована!');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTenMinutesLeft = timeLeft <= 10 * 60 && timeLeft > 5 * 60;
  const isFiveMinutesLeft = timeLeft <= 5 * 60 && timeLeft > 0;
  const progressPct = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const timerColor = isFiveMinutesLeft
    ? '#ef4444'
    : isTenMinutesLeft
    ? '#f59e0b'
    : 'var(--text-primary)';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in overflow-hidden select-none"
      style={{
        background: 'var(--bg)',
        color: 'var(--text-primary)',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Header: Exam Control Bar */}
      <header
        className="h-16 px-6 flex items-center justify-between border-b flex-shrink-0"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Left: Exam Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
            }}
          >
            IELTS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                {isTask1 ? 'Task 1 (Academic)' : 'Task 2 (Essay)'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                Official Time: {isTask1 ? '20 mins' : '40 mins'}
              </span>
            </div>
            <h1 className="text-sm font-semibold truncate max-w-md" style={{ color: 'var(--text-primary)' }}>
              {assignment.title}
            </h1>
          </div>
        </div>

        {/* Center: Digital Countdown Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl border font-mono transition-all duration-300 ${
              isFiveMinutesLeft ? 'animate-pulse' : ''
            }`}
            style={{
              background: isFiveMinutesLeft
                ? 'rgba(239,68,68,0.12)'
                : isTenMinutesLeft
                ? 'rgba(245,158,11,0.12)'
                : 'var(--bg-card-2)',
              borderColor: isFiveMinutesLeft
                ? 'rgba(239,68,68,0.4)'
                : isTenMinutesLeft
                ? 'rgba(245,158,11,0.4)'
                : 'var(--border)',
            }}
          >
            <Clock size={18} style={{ color: timerColor }} />
            <div className="text-2xl font-black tracking-wider" style={{ color: timerColor }}>
              {formatTime(timeLeft)}
            </div>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn-ghost p-2 rounded-lg"
            title={isPaused ? 'Resume timer' : 'Pause timer'}
          >
            {isPaused ? <Play size={16} className="text-green-400" /> : <Pause size={16} />}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {tabSwitchWarnings > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold"
              style={{
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
              title="Window blur warnings"
            >
              <ShieldAlert size={13} />
              {tabSwitchWarnings} warning{tabSwitchWarnings > 1 ? 's' : ''}
            </span>
          )}

          <button
            onClick={() => setShowExitConfirm(true)}
            className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg"
          >
            <Minimize2 size={14} />
            Exit Exam Mode
          </button>

          <button
            onClick={() => {
              if (wordCount < minWords) {
                triggerWarning(`Please reach minimum ${minWords} words before submitting.`);
                return;
              }
              onSubmitExam(text.slice(0, MAX_ESSAY_CHARS).trim(), totalSeconds - timeLeft);
            }}
            disabled={wordCount < minWords || isAutoSubmitting}
            className="btn-primary text-xs flex items-center gap-2 px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Submit Exam
          </button>
        </div>
      </header>

      {/* Progress Line */}
      <div className="w-full h-1 bg-slate-800 flex-shrink-0">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${Math.min(100, progressPct)}%`,
            background: isFiveMinutesLeft ? '#ef4444' : isTenMinutesLeft ? '#f59e0b' : 'var(--accent)',
          }}
        />
      </div>

      {/* Alert Banners (10m / 5m / Warning Messages) */}
      {lastWarningMsg && (
        <div
          className="px-6 py-2.5 text-xs font-semibold flex items-center justify-between animate-slide-up flex-shrink-0"
          style={{
            background: 'rgba(239,68,68,0.15)',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{lastWarningMsg}</span>
          </div>
          <button onClick={() => setLastWarningMsg(null)} className="p-1 hover:opacity-80">
            <X size={13} />
          </button>
        </div>
      )}

      {isFiveMinutesLeft && !lastWarningMsg && (
        <div
          className="px-6 py-2 text-xs font-semibold flex items-center gap-2 animate-pulse flex-shrink-0"
          style={{
            background: 'rgba(239,68,68,0.15)',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
          }}
        >
          <AlertCircle size={14} />
          <span>🚨 5 MINUTES REMAINING: Review your arguments, check spelling, and ensure complex grammar accuracy.</span>
        </div>
      )}

      {isTenMinutesLeft && !isFiveMinutesLeft && !lastWarningMsg && (
        <div
          className="px-6 py-2 text-xs font-semibold flex items-center gap-2 flex-shrink-0"
          style={{
            background: 'rgba(245,158,11,0.15)',
            borderBottom: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b',
          }}
        >
          <Clock size={14} />
          <span>⚠️ 10 MINUTES REMAINING: Start writing your conclusion paragraph to fulfill Task Response requirements.</span>
        </div>
      )}

      {/* Main Exam Canvas */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Task Prompt Panel */}
        <aside
          className="w-1/3 min-w-[340px] max-w-md border-r p-6 overflow-y-auto flex flex-col gap-5 flex-shrink-0"
          style={{
            background: 'var(--bg-card-2)',
            borderColor: 'var(--border)',
          }}
        >
          <div>
            <div className="section-label mb-2">IELTS Task Requirements</div>
            <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-violet-400" />
                Minimum {minWords} words
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-violet-400" />
                Target: {isTask1 ? '20 mins' : '40 mins'}
              </span>
            </div>
          </div>

          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <FileText size={13} />
              Prompt Statement
            </div>
            <div className="text-sm leading-relaxed space-y-3 font-serif" style={{ color: 'var(--text-primary)' }}>
              {assignment.prompt.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          <div
            className="p-4 rounded-xl border text-xs space-y-2"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <ShieldCheck size={14} className="text-green-400" />
              Official IELTS Band Descriptors
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong className="text-slate-300">Task Response:</strong> Answer all parts with clear view throughout.</li>
              <li><strong className="text-slate-300">Coherence:</strong> Logical paragraph structure & clear transitions.</li>
              <li><strong className="text-slate-300">Lexical Resource:</strong> Formal vocabulary, collocations, precise phrasing.</li>
              <li><strong className="text-slate-300">Grammar:</strong> Variety of complex sentences with high accuracy.</li>
            </ul>
          </div>
        </aside>

        {/* Right Side: Distraction-free Writing Paper */}
        <section className="flex-1 flex flex-col p-8 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className={`text-sm font-bold ${wordCount >= minWords ? 'text-green-400' : 'text-amber-400'}`}>
                {wordCount} / {minWords} words
              </span>
              {wordCount >= minWords && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Requirement Met
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="font-mono">
                {charCount.toLocaleString()} / {MAX_ESSAY_CHARS.toLocaleString()} chars
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-[11px]">
                🛡️ Exam Lock: Paste Disabled
              </span>
            </div>
          </div>

          {/* Writing Textarea */}
          <div className="flex-1 relative flex flex-col">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_ESSAY_CHARS))}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onKeyDown={handleKeyDown}
              maxLength={MAX_ESSAY_CHARS}
              disabled={isPaused || isAutoSubmitting}
              placeholder="Begin typing your IELTS essay under timed exam conditions. Paste is disabled..."
              className="w-full flex-1 bg-transparent text-lg leading-9 outline-none resize-none font-serif placeholder-slate-600"
              style={{
                color: 'var(--text-primary)',
              }}
            />

            {/* Pause Overlay */}
            {isPaused && (
              <div
                className="absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.7)' }}
              >
                <Pause size={48} className="text-violet-400 mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white">Exam Simulation Paused</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">The countdown timer and input are paused.</p>
                <button
                  onClick={() => setIsPaused(false)}
                  className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
                >
                  <Play size={15} /> Resume Writing
                </button>
              </div>
            )}

            {/* Auto Submitting Overlay */}
            {isAutoSubmitting && (
              <div
                className="absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl z-20"
                style={{ background: 'rgba(0,0,0,0.85)' }}
              >
                <Clock size={48} className="text-red-500 mb-3 animate-spin" />
                <h3 className="text-xl font-bold text-white">Time Expired!</h3>
                <p className="text-sm text-slate-300 mt-1">Submitting your essay for IELTS peer review...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl p-6 border shadow-2xl animate-scale-in space-y-4"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Exit Exam Simulator?
                </h3>
                <p className="text-xs text-slate-400">
                  Your essay draft will be preserved in standard writing mode.
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              If you exit now, official exam conditions (countdown timer and full-screen focus) will end. You can continue writing and editing normally.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Continue Exam
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onSaveAndExit(text);
                }}
                className="btn-primary flex-1 text-xs py-2.5"
              >
                Save & Exit to Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSimulatorModal;
