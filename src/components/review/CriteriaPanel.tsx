import React, { useState } from 'react';
import { useStore, canEditReviewCriterion } from '../../store/useStore';
import CriteriaSection from './CriteriaSection';
import CharCounter from '../ui/CharCounter';
import { Target, Link2, BookOpen, Zap, Send, Layers, CheckSquare, Square, UserCheck } from 'lucide-react';
import type { CriterionKey } from '../../types';

const MAX_VERDICT_CHARS = 3000;

function getBandLabel(band: number): string {
  if (band >= 8.5) return 'Expert';
  if (band >= 7.5) return 'Very Good';
  if (band >= 6.5) return 'Competent';
  if (band >= 5.5) return 'Modest';
  if (band >= 4.5) return 'Limited';
  return 'Developing';
}

function getBandColor(band: number): string {
  if (band >= 7) return '#16a34a';
  if (band >= 5) return '#b45309';
  return '#dc2626';
}

const CRITERIA_CONFIG: { key: CriterionKey; label: string; short: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }> }[] = [
  { key: 'taskResponse', label: 'Task Response', short: 'TR', icon: Target },
  { key: 'coherence', label: 'Coherence & Cohesion', short: 'C&C', icon: Link2 },
  { key: 'lexicalResource', label: 'Lexical Resource', short: 'LR', icon: BookOpen },
  { key: 'grammar', label: 'Grammar Accuracy', short: 'GRA', icon: Zap },
];

export const CriteriaPanel: React.FC = () => {
  const { currentUser, activeReview, updateGeneralVerdict, submitReview, setReviewedCriteria } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!activeReview) return null;

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try { await submitReview(); } finally { setIsSubmitting(false); }
  };

  const { overallBand, generalVerdict, criteria, criteriaEvaluators } = activeReview;
  const bandColor = getBandColor(overallBand);

  const selectedCriteria = activeReview.reviewedCriteria ?? [];

  const isModular = selectedCriteria.length < 4;

  const toggleCriterion = (key: CriterionKey) => {
    let next: CriterionKey[];
    if (selectedCriteria.includes(key)) {
      if (selectedCriteria.length === 1) return; // Keep at least one criterion selected
      next = selectedCriteria.filter((k) => k !== key);
    } else {
      next = [...selectedCriteria, key];
    }
    setReviewedCriteria(next);
  };

  const selectAll = () => {
    setReviewedCriteria(['taskResponse', 'coherence', 'lexicalResource', 'grammar']);
  };

  const selectOnly = (key: CriterionKey) => {
    setReviewedCriteria([key]);
  };

  // Only the selected criteria must have feedback filled
  const selectedFilled = selectedCriteria.every((k) => criteria[k].feedback.trim().length > 0);
  const canSubmit = selectedCriteria.length > 0 && selectedFilled && (isModular ? true : generalVerdict.trim().length > 0);

  const iconStyle = { color: 'var(--text-secondary)' };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Header with Modular Selection */}
      <div
        className="px-5 py-4 flex-shrink-0 space-y-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers size={15} className="text-blue-400" />
              Критерии оценки IELTS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isModular ? 'Модульная проверка: оценивайте выбранные критерии' : 'Полная проверка по всем 4 критериям'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={selectAll}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                !isModular ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'btn-ghost'
              }`}
            >
              Все 4
            </button>
            <button
              onClick={() => selectOnly('grammar')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                isModular && selectedCriteria.length === 1 && selectedCriteria[0] === 'grammar'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'btn-ghost'
              }`}
            >
              Только грамматика
            </button>
          </div>
        </div>

        {/* Criteria selector pills */}
        <p className="text-xs text-slate-400">Критерии других участников защищены. Их может исправить преподаватель класса.</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CRITERIA_CONFIG.map((c) => {
            const isSelected = selectedCriteria.includes(c.key);
            const evaluator = criteriaEvaluators?.[c.key];

            return (
              <button
                key={c.key}
                type="button"
                disabled={!canEditReviewCriterion(activeReview, c.key, currentUser?.id || '')}
                onClick={() => toggleCriterion(c.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-200 border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'bg-slate-900/40 text-slate-400 border-slate-700/40 opacity-70 hover:opacity-100'
                }`}
                title={evaluator ? `Уже оценено: ${evaluator.userName} (Band ${evaluator.band})` : 'Нажмите, чтобы включить/исключить критерий'}
              >
                {isSelected ? <CheckSquare size={12} className="text-blue-400" /> : <Square size={12} />}
                <span>{c.short}</span>
                {evaluator && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" title={`Оценено: ${evaluator.userName}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Criteria list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {selectedCriteria.includes('taskResponse') && (
          <div className="relative">
            {criteriaEvaluators?.taskResponse && (
              <div className="mb-1 text-[11px] text-green-400 flex items-center gap-1">
                <UserCheck size={11} /> Оценено ({criteriaEvaluators.taskResponse.userName}): Band {criteriaEvaluators.taskResponse.band}
              </div>
            )}
            <CriteriaSection
              criterionKey="taskResponse"
              title="Task Achievement / Response"
              icon={<Target size={14} style={iconStyle} />}
              defaultOpen={true}
              checklistItems={[
                { key: 'allPartsAddressed', label: 'All parts of the task addressed' },
                { key: 'clearPosition',     label: "Clear position / author's view" },
                { key: 'examplesProvided',  label: 'Relevant examples provided' },
                { key: 'adequateLength',    label: 'Adequate length (≥ min words)' },
              ]}
              feedbackPlaceholder="Комментарий по раскрытию темы и примерам..."
            />
          </div>
        )}

        {selectedCriteria.includes('coherence') && (
          <div className="relative">
            {criteriaEvaluators?.coherence && (
              <div className="mb-1 text-[11px] text-green-400 flex items-center gap-1">
                <UserCheck size={11} /> Оценено ({criteriaEvaluators.coherence.userName}): Band {criteriaEvaluators.coherence.band}
              </div>
            )}
            <CriteriaSection
              criterionKey="coherence"
              title="Coherence & Cohesion"
              icon={<Link2 size={14} style={iconStyle} />}
              checklistItems={[
                { key: 'logicalParagraphs',   label: 'Logical paragraph structure' },
                { key: 'correctLinkingWords', label: 'Accurate and varied linking words' },
                { key: 'clearProgression',    label: 'Clear information progression' },
              ]}
              feedbackPlaceholder="Комментарий по структуре абзацев и связующим словам..."
            />
          </div>
        )}

        {selectedCriteria.includes('lexicalResource') && (
          <div className="relative">
            {criteriaEvaluators?.lexicalResource && (
              <div className="mb-1 text-[11px] text-green-400 flex items-center gap-1">
                <UserCheck size={11} /> Оценено ({criteriaEvaluators.lexicalResource.userName}): Band {criteriaEvaluators.lexicalResource.band}
              </div>
            )}
            <CriteriaSection
              criterionKey="lexicalResource"
              title="Lexical Resource"
              icon={<BookOpen size={14} style={iconStyle} />}
              checklistItems={[
                { key: 'academicVocabulary',       label: 'Academic / formal vocabulary range' },
                { key: 'noFrequentRepetition',     label: 'Avoidance of frequent repetition' },
                { key: 'appropriateCollocations',  label: 'Natural and appropriate collocations' },
              ]}
              feedbackPlaceholder="Комментарий по лексическому запасу и коллокациям..."
            />
          </div>
        )}

        {selectedCriteria.includes('grammar') && (
          <div className="relative">
            {criteriaEvaluators?.grammar && (
              <div className="mb-1 text-[11px] text-green-400 flex items-center gap-1">
                <UserCheck size={11} /> Оценено ({criteriaEvaluators.grammar.userName}): Band {criteriaEvaluators.grammar.band}
              </div>
            )}
            <CriteriaSection
              criterionKey="grammar"
              title="Grammatical Range & Accuracy"
              icon={<Zap size={14} style={iconStyle} />}
              checklistItems={[
                { key: 'complexSentences',        label: 'Variety of complex structures' },
                { key: 'minimalPunctuationErrors',label: 'Minimal punctuation errors' },
              ]}
              feedbackPlaceholder="Комментарий по грамматике и синтаксическим конструкциям..."
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 flex-shrink-0 space-y-4"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        {/* Overall band display */}
        <div
          className="rounded-xl p-4"
          style={{
            border: `1px solid ${bandColor}30`,
            background: `${bandColor}08`,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="section-label mb-1" style={{ color: 'var(--text-muted)' }}>
                {isModular ? 'Текущий Band (по выбранным критериям)' : 'Overall Band Score'}
              </div>
              <div className="text-xs" style={{ color: bandColor }}>
                {getBandLabel(overallBand)} · {isModular ? `Оценено ${selectedCriteria.length} критерия` : 'Авторасчет по правилам IELTS'}
              </div>
            </div>
            <div className="text-4xl font-black" style={{ color: bandColor }}>
              {overallBand.toFixed(1)}
            </div>
          </div>

          {/* Sub-scores */}
          <div className="mt-3 pt-3 grid grid-cols-4 gap-2" style={{ borderTop: `1px solid ${bandColor}20` }}>
            {CRITERIA_CONFIG.map((s) => {
              const val = criteria[s.key].band;
              const isChecked = selectedCriteria.includes(s.key);
              return (
                <div key={s.short} className={`text-center ${!isChecked ? 'opacity-40' : ''}`}>
                  <div className="text-sm font-bold" style={{ color: getBandColor(val) }}>
                    {val.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400">{s.short}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* General verdict */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="section-label block">
              Общий вердикт {isModular ? '(необязательно для модульной проверки)' : ''}
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {generalVerdict.length} / {MAX_VERDICT_CHARS}
            </span>
          </div>
          <textarea
            value={generalVerdict}
            maxLength={MAX_VERDICT_CHARS}
            onChange={(e) => updateGeneralVerdict(e.target.value.slice(0, MAX_VERDICT_CHARS))}
            placeholder={
              isModular
                ? "Краткий совет или рекомендация автору по проверенным критериям..."
                : "Напишите итоговый вердикт — сильные стороны, ошибки и советы для следующего бэнда..."
            }
            className="textarea-field text-sm h-20"
          />
          <CharCounter value={generalVerdict} max={MAX_VERDICT_CHARS} warnAt={600} />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {isModular ? `Сохранить модульную оценку (${selectedCriteria.length} крит.)` : 'Отправить полную рецензию'}
        </button>

        {!canSubmit && (
          <p className="text-xs text-center text-slate-400">
            Заполните поля обратной связи для всех выбранных критериев ({selectedCriteria.join(', ')})
          </p>
        )}
      </div>
    </div>
  );
};

export default CriteriaPanel;
