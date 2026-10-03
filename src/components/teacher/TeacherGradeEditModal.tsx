import React, { useState } from 'react';
import {
  X, GraduationCap, RotateCcw,
  Sparkles, Save, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import type { Review, Essay, Assignment, User } from '../../types';
import { useStore, calculateOverallBand } from '../../store/useStore';

interface TeacherGradeEditModalProps {
  review?: Review | null;
  essay: Essay;
  assignment: Assignment;
  onClose: () => void;
}

const BAND_OPTIONS = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

const CRITERIA_NAMES: Record<'taskResponse' | 'coherence' | 'lexicalResource' | 'grammar', { title: string; short: string; desc: string }> = {
  taskResponse: {
    title: 'Task Response',
    short: 'TR',
    desc: 'Addresses all parts of prompt, clear position throughout, well-developed ideas',
  },
  coherence: {
    title: 'Coherence & Cohesion',
    short: 'C&C',
    desc: 'Logical sequencing, paragraphing, effective cohesive devices and referencing',
  },
  lexicalResource: {
    title: 'Lexical Resource',
    short: 'LR',
    desc: 'Range of vocabulary, collocations, precision, awareness of style and register',
  },
  grammar: {
    title: 'Grammatical Range & Accuracy',
    short: 'GRA',
    desc: 'Variety of complex structures, grammatical precision, accurate punctuation',
  },
};

const TeacherGradeEditModal: React.FC<TeacherGradeEditModalProps> = ({
  review,
  essay,
  assignment,
  onClose,
}) => {
  const { users, updateReviewByTeacher, createTeacherReview } = useStore();

  const author: User | undefined = users.find((u) => u.id === essay.authorId);
  const reviewer: User | undefined = review ? users.find((u) => u.id === review.reviewerId) : undefined;

  // Criteria bands & feedback
  const [trBand, setTrBand] = useState<number>(review?.criteria.taskResponse.band ?? 6.0);
  const [trFeedback, setTrFeedback] = useState<string>(review?.criteria.taskResponse.feedback ?? '');

  const [ccBand, setCcBand] = useState<number>(review?.criteria.coherence.band ?? 6.0);
  const [ccFeedback, setCcFeedback] = useState<string>(review?.criteria.coherence.feedback ?? '');

  const [lrBand, setLrBand] = useState<number>(review?.criteria.lexicalResource.band ?? 6.0);
  const [lrFeedback, setLrFeedback] = useState<string>(review?.criteria.lexicalResource.feedback ?? '');

  const [graBand, setGraBand] = useState<number>(review?.criteria.grammar.band ?? 6.0);
  const [graFeedback, setGraFeedback] = useState<string>(review?.criteria.grammar.feedback ?? '');

  const [generalVerdict, setGeneralVerdict] = useState<string>(review?.generalVerdict ?? '');
  const [teacherFeedback, setTeacherFeedback] = useState<string>(review?.teacherFeedback ?? '');
  const [showEssayPreview, setShowEssayPreview] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // Computed overall band
  const computedOverallBand = calculateOverallBand([trBand, ccBand, lrBand, graBand]);
  const [manualOverrideBand, setManualOverrideBand] = useState<number | null>(
    review ? review.overallBand : null
  );

  const effectiveBand = manualOverrideBand !== null ? manualOverrideBand : computedOverallBand;

  const originalBand = review?.originalBand ?? review?.overallBand ?? null;

  const handleBandChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    val: number
  ) => {
    setter(val);
    // Reset manual override so auto-calculate takes precedence
    setManualOverrideBand(null);
  };

  const handleResetToPeer = () => {
    if (!review) return;
    setTrBand(review.criteria.taskResponse.band);
    setTrFeedback(review.criteria.taskResponse.feedback);
    setCcBand(review.criteria.coherence.band);
    setCcFeedback(review.criteria.coherence.feedback);
    setLrBand(review.criteria.lexicalResource.band);
    setLrFeedback(review.criteria.lexicalResource.feedback);
    setGraBand(review.criteria.grammar.band);
    setGraFeedback(review.criteria.grammar.feedback);
    setGeneralVerdict(review.generalVerdict);
    setManualOverrideBand(review.originalBand ?? review.overallBand);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const criteriaPayload = {
      taskResponse: {
        band: trBand,
        feedback: trFeedback,
        checklistState: review?.criteria.taskResponse.checklistState || {
          allPartsAddressed: true,
          clearPosition: true,
          examplesProvided: true,
          adequateLength: true,
        },
      },
      coherence: {
        band: ccBand,
        feedback: ccFeedback,
        checklistState: review?.criteria.coherence.checklistState || {
          logicalParagraphs: true,
          correctLinkingWords: true,
          clearProgression: true,
        },
      },
      lexicalResource: {
        band: lrBand,
        feedback: lrFeedback,
        checklistState: review?.criteria.lexicalResource.checklistState || {
          academicVocabulary: true,
          noFrequentRepetition: true,
          appropriateCollocations: true,
        },
      },
      grammar: {
        band: graBand,
        feedback: graFeedback,
        checklistState: review?.criteria.grammar.checklistState || {
          complexSentences: true,
          minimalPunctuationErrors: true,
        },
      },
    };

    setIsSaving(true);
    try {
    const saved = review
      ? await updateReviewByTeacher(review.id, {
        criteria: criteriaPayload,
        overallBand: effectiveBand,
        generalVerdict,
        teacherFeedback: teacherFeedback.trim() || undefined,
      })
      : await createTeacherReview(essay.id, {
        criteria: criteriaPayload,
        overallBand: effectiveBand,
        generalVerdict,
        teacherFeedback: teacherFeedback.trim() || undefined,
      });
    if (saved) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return '#16a34a';
    if (score >= 6.5) return '#2563eb';
    if (score >= 5.5) return '#d97706';
    return '#dc2626';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b flex-shrink-0"
          style={{ background: 'var(--bg-card-2)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
            >
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {review ? 'Редактирование оценки ученика' : 'Выставление оценки преподавателя'}
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Teacher Mode
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {assignment.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-slate-200"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Relationship Summary Banner: Who Rated Whom */}
        <div
          className="px-6 py-3 border-b flex items-center justify-between flex-wrap gap-4 text-xs"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
        >
          {/* Author */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Автор эссе:</span>
            <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 text-[10px] flex items-center justify-center font-bold">
                {author?.avatar || 'AU'}
              </span>
              <span>{author?.name || 'Ученик'}</span>
            </div>
          </div>

          {/* Arrow / Connection */}
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <span>➔</span>
            <span>оценил</span>
            <span>➔</span>
          </div>

          {/* Reviewer */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Рецензент:</span>
            <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
              <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 text-[10px] flex items-center justify-center font-bold">
                {reviewer?.avatar || (review ? 'PR' : 'TR')}
              </span>
              <span>
                {reviewer?.name || (review ? 'Студент-рецензент' : 'Преподаватель (прямая оценка)')}
              </span>
            </div>
          </div>

          {/* Overall score preview */}
          <div className="flex items-center gap-2 ml-auto">
            {originalBand !== null && originalBand !== effectiveBand && (
              <span className="line-through text-slate-500 font-bold">
                Band {originalBand.toFixed(1)}
              </span>
            )}
            <div
              className="px-3 py-1 rounded-lg font-black text-sm flex items-center gap-1 shadow-sm"
              style={{
                background: `${getScoreColor(effectiveBand)}18`,
                color: getScoreColor(effectiveBand),
                border: `1px solid ${getScoreColor(effectiveBand)}40`,
              }}
            >
              <Sparkles size={13} />
              Итоговый Band: {effectiveBand.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Essay Collapsible Preview */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card-2)' }}
          >
            <button
              type="button"
              onClick={() => setShowEssayPreview(!showEssayPreview)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <UserCheck size={14} className="text-purple-400" />
                <span>Текст эссе ученика ({essay.wordCount} слов)</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span>{showEssayPreview ? 'Свернуть' : 'Развернуть для чтения'}</span>
                {showEssayPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>
            {showEssayPreview && (
              <div
                className="px-4 py-3 text-xs leading-relaxed font-serif max-h-56 overflow-y-auto border-t whitespace-pre-wrap"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {essay.content}
              </div>
            )}
          </div>

          {/* 4 Criteria Editors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Критерии оценки IELTS (редактируемые)
              </h3>
              {review && (
                <button
                  type="button"
                  onClick={handleResetToPeer}
                  className="btn-ghost text-xs flex items-center gap-1 text-slate-400 hover:text-slate-200"
                >
                  <RotateCcw size={12} /> Сбросить к баллам рецензента
                </button>
              )}
            </div>

            {/* Task Response */}
            <CriterionEditorBlock
              criterionKey="taskResponse"
              band={trBand}
              feedback={trFeedback}
              onBandChange={(b) => handleBandChange(setTrBand, b)}
              onFeedbackChange={setTrFeedback}
            />

            {/* Coherence & Cohesion */}
            <CriterionEditorBlock
              criterionKey="coherence"
              band={ccBand}
              feedback={ccFeedback}
              onBandChange={(b) => handleBandChange(setCcBand, b)}
              onFeedbackChange={setCcFeedback}
            />

            {/* Lexical Resource */}
            <CriterionEditorBlock
              criterionKey="lexicalResource"
              band={lrBand}
              feedback={lrFeedback}
              onBandChange={(b) => handleBandChange(setLrBand, b)}
              onFeedbackChange={setLrFeedback}
            />

            {/* Grammatical Range & Accuracy */}
            <CriterionEditorBlock
              criterionKey="grammar"
              band={graBand}
              feedback={graFeedback}
              onBandChange={(b) => handleBandChange(setGraBand, b)}
              onFeedbackChange={setGraFeedback}
            />
          </div>

          {/* General Verdict */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--bg-card-2)', borderColor: 'var(--border)' }}
          >
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Общий вердикт и рекомендации по работе:
            </label>
            <textarea
              value={generalVerdict}
              onChange={(e) => setGeneralVerdict(e.target.value)}
              placeholder="Общие впечатления, ключевые сильные стороны и зоны роста..."
              rows={3}
              className="w-full text-xs p-3 rounded-lg border outline-none resize-none transition-all leading-relaxed"
              style={{
                background: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Teacher's Official Comment */}
          <div
            className="rounded-xl p-4 border"
            style={{
              background: 'rgba(147, 51, 234, 0.05)',
              borderColor: 'rgba(147, 51, 234, 0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <GraduationCap size={15} className="text-purple-400" />
              <label className="text-xs font-bold text-purple-300">
                Официальный комментарий учителя к изменению оценки:
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Этот комментарий будет виден ученику в карточке оценки и объяснит, почему балл был скорректирован.
            </p>
            <textarea
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              placeholder="Например: 'Балл скорректирован с 6.5 до 7.5: аргументация во втором абзаце полностью раскрыта, лексика использована академически верно...'"
              rows={2}
              className="w-full text-xs p-3 rounded-lg border outline-none resize-none transition-all leading-relaxed"
              style={{
                background: 'var(--bg)',
                borderColor: 'rgba(147, 51, 234, 0.3)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0"
          style={{ background: 'var(--bg-card-2)', borderColor: 'var(--border)' }}
        >
          <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span>Итоговый балл:</span>
            <span
              className="font-black text-base px-2 py-0.5 rounded"
              style={{
                background: `${getScoreColor(effectiveBand)}20`,
                color: getScoreColor(effectiveBand),
              }}
            >
              Band {effectiveBand.toFixed(1)}
            </span>
            {review?.originalBand && review.originalBand !== effectiveBand && (
              <span className="text-[11px] text-slate-500">
                (было {review.originalBand.toFixed(1)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs px-4 py-2"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary text-xs flex items-center gap-2 px-5 py-2.5 shadow-lg"
            >
              <Save size={14} />
              {isSaving ? 'Сохранение…' : 'Сохранить и опубликовать оценку'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CriterionEditorBlockProps {
  criterionKey: 'taskResponse' | 'coherence' | 'lexicalResource' | 'grammar';
  band: number;
  feedback: string;
  onBandChange: (band: number) => void;
  onFeedbackChange: (feedback: string) => void;
}

const CriterionEditorBlock: React.FC<CriterionEditorBlockProps> = ({
  criterionKey,
  band,
  feedback,
  onBandChange,
  onFeedbackChange,
}) => {
  const meta = CRITERIA_NAMES[criterionKey];

  return (
    <div
      className="p-3.5 rounded-xl border transition-all"
      style={{
        background: 'var(--bg-card-2)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
            {meta.title} ({meta.short})
          </span>
          <p className="text-[10px] text-slate-500 line-clamp-1">{meta.desc}</p>
        </div>
        <div
          className="text-xs font-black px-2.5 py-0.5 rounded-md"
          style={{
            background: band >= 7 ? 'rgba(22,163,74,0.15)' : band >= 6 ? 'rgba(37,99,235,0.15)' : 'rgba(217,119,6,0.15)',
            color: band >= 7 ? '#16a34a' : band >= 6 ? '#2563eb' : '#d97706',
          }}
        >
          Band {band.toFixed(1)}
        </div>
      </div>

      {/* Band selector buttons */}
      <div className="flex flex-wrap gap-1 mb-2">
        {BAND_OPTIONS.map((b) => {
          const isSelected = b === band;
          return (
            <button
              key={b}
              type="button"
              onClick={() => onBandChange(b)}
              className={`text-[11px] px-2 py-1 rounded font-bold transition-all ${
                isSelected ? 'shadow-sm' : ''
              }`}
              style={{
                background: isSelected ? 'var(--accent)' : 'var(--bg)',
                color: isSelected ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {b.toFixed(1)}
            </button>
          );
        })}
      </div>

      {/* Criterion feedback input */}
      <input
        type="text"
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder={`Комментарий учителя по ${meta.title}...`}
        className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none transition-all"
        style={{
          background: 'var(--bg)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
};

export default TeacherGradeEditModal;
