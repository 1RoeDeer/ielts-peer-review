import React from 'react';
import {
  Users, FileText, CheckCircle2, Edit3, Star,
  Clock, Zap, ShieldCheck, AlertTriangle, Download
} from 'lucide-react';
import type { Essay, Review, User, Assignment } from '../../types';

interface TeacherSubmissionsViewProps {
  assignment: Assignment;
  submissions: Essay[];
  users: User[];
  reviews: Review[];
  onOpenGradeEdit: (data: { review?: Review; essay: Essay }) => void;
}

export const TeacherSubmissionsView: React.FC<TeacherSubmissionsViewProps> = ({
  assignment: _assignment,
  submissions,
  users,
  reviews,
  onOpenGradeEdit,
}) => {
  const getAuthor = (authorId: string): User | undefined => users.find((u) => u.id === authorId);

  const handleExportCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'ФИО студента',
      'Статус сдачи',
      'Дата сдачи',
      'Количество слов',
      'Время написания (сек)',
      'Темп (WPM)',
      'Попыток вставки',
      'Итоговый Band',
      'Task Response (TR)',
      'Coherence & Cohesion (CC)',
      'Lexical Resource (LR)',
      'Grammar Accuracy (GRA)',
      'Количество рецензий',
    ];

    const rows = submissions.map((essay) => {
      const author = getAuthor(essay.authorId);
      const essayReviews = reviews.filter((r) => r.essayId === essay.id && r.isComplete);
      const avgBand = essayReviews.length
        ? (essayReviews.reduce((sum, r) => sum + r.overallBand, 0) / essayReviews.length).toFixed(1)
        : '—';

      const primaryReview = essayReviews[0];
      const tr = primaryReview?.criteria.taskResponse.band.toFixed(1) || '—';
      const cc = primaryReview?.criteria.coherence.band.toFixed(1) || '—';
      const lr = primaryReview?.criteria.lexicalResource.band.toFixed(1) || '—';
      const gra = primaryReview?.criteria.grammar.band.toFixed(1) || '—';

      return [
        `"${author?.name || 'Студент'}"`,
        `"${essay.status === 'submitted' ? 'Сдано' : essay.status}"`,
        `"${essay.submittedAt ? new Date(essay.submittedAt).toLocaleDateString('ru-RU') : '—'}"`,
        essay.wordCount,
        essay.timeSpentSeconds || 0,
        essay.averageWpm || 0,
        essay.pasteAttempts || 0,
        avgBand,
        tr,
        cc,
        lr,
        gra,
        essayReviews.length,
      ].join(';');
    });

    // Add UTF-8 BOM so Excel opens Russian text correctly
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (_assignment.title || 'Assignment').replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
    link.setAttribute('download', `Ведомость_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/40">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users size={16} className="text-violet-400" />
            Сданные работы учеников ({submissions.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Просматривайте эссе, отчёты о честности набора текста и выставляйте экспертные баллы
          </p>
        </div>

        {submissions.length > 0 && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 text-xs py-2 px-3.5"
            title="Скачать оценки и статистику в формате Excel / CSV"
          >
            <Download size={13} className="text-violet-400" />
            Скачать ведомость (Excel / CSV)
          </button>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-700/60">
          <FileText size={32} className="mx-auto text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-slate-300">Пока нет сданных работ</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Студенты еще не сдали эссе по данному заданию. По мере сдачи работы появятся здесь.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((essay) => {
            const author = getAuthor(essay.authorId);
            const essayReviews = reviews.filter((r) => r.essayId === essay.id);
            const completedReviews = essayReviews.filter((r) => r.isComplete);
            const avgBand = completedReviews.length
              ? (completedReviews.reduce((sum, r) => sum + r.overallBand, 0) / completedReviews.length).toFixed(1)
              : null;
            const primaryReview = completedReviews[0];

            return (
              <div
                key={essay.id}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-slate-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Author & Honesty Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-violet-600/30 text-violet-200 border border-violet-500/30 flex-shrink-0">
                      {author?.avatar || 'ST'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">{author?.name || 'Студент'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{essay.wordCount} слов</span>
                        <span>·</span>
                        <span>{essay.submittedAt ? new Date(essay.submittedAt).toLocaleDateString() : '—'}</span>
                        {essay.isExamMode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-900/40 text-violet-300 border border-violet-700/30">
                            ⏱️ Симуляция экзамена
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Honesty Report for Teacher */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {essay.timeSpentSeconds !== undefined && essay.timeSpentSeconds > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono flex items-center gap-1">
                        <Clock size={11} className="text-violet-400" />
                        {Math.floor(essay.timeSpentSeconds / 60)}м {essay.timeSpentSeconds % 60}с
                      </span>
                    )}

                    {essay.averageWpm !== undefined && essay.averageWpm > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono flex items-center gap-1">
                        <Zap size={11} className="text-amber-400" />
                        {essay.averageWpm} сл/мин
                      </span>
                    )}

                    {(essay.pasteAttempts || 0) > 0 ? (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold flex items-center gap-1">
                        <AlertTriangle size={11} />
                        Попыток вставки: {essay.pasteAttempts}
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold flex items-center gap-1">
                        <ShieldCheck size={11} />
                        Честный ввод
                      </span>
                    )}
                  </div>
                </div>

                {/* Reviews & Status Info */}
                <div className="flex items-center gap-4 flex-wrap md:justify-end">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 justify-end">
                      <CheckCircle2 size={13} className="text-green-400" />
                      Рецензий: {completedReviews.length}
                    </div>
                    {avgBand ? (
                      <div className="text-xs text-amber-300 font-bold flex items-center gap-1 justify-end mt-0.5">
                        <Star size={11} />
                        Средний Band: {avgBand}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 mt-0.5">Ожидает проверок</div>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenGradeEdit({ review: primaryReview, essay })}
                    className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5 whitespace-nowrap"
                  >
                    <Edit3 size={13} />
                    {primaryReview ? 'Оценить / Изменить балл' : 'Выставить оценку учителя'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherSubmissionsView;
