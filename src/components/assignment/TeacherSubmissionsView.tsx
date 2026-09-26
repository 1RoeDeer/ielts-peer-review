import { Users, FileText, CheckCircle2, Edit3, Star } from 'lucide-react';
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

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users size={16} className="text-violet-400" />
            Сданные работы учеников ({submissions.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Просматривайте эссе, взаимные рецензии одноклассников и выставляйте экспертные баллы
          </p>
        </div>
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
                {/* Author Info */}
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
