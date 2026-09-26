import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Users, Eye, Sparkles, GitCompare,
  Clock, MessageSquare
} from 'lucide-react';
import FeedbackViewer from '../feedback/FeedbackViewer';
import ModelEssayPanel from './ModelEssayPanel';
import type { Essay, Review, Assignment, User, ModelEssay } from '../../types';

interface StudentFeedbackViewProps {
  assignment: Assignment;
  currentEssay: Essay;
  receivedReviews: Review[];
  myReviewsGivenCount: number;
  availableEssaysToReview: Essay[];
  users: User[];
  modelEssay?: ModelEssay;
}

export const StudentFeedbackView: React.FC<StudentFeedbackViewProps> = ({
  assignment,
  currentEssay,
  receivedReviews,
  myReviewsGivenCount,
  availableEssaysToReview,
  users,
  modelEssay,
}) => {
  const navigate = useNavigate();
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'feedback' | 'model'>('feedback');

  const activeReview = receivedReviews[activeReviewIdx] || receivedReviews[0];
  const reviewerUser = activeReview ? users.find((u) => u.id === activeReview.reviewerId) : null;

  const getBandColor = (band: number) => {
    if (band >= 7.0) return '#16a34a';
    if (band >= 5.5) return '#b45309';
    return '#dc2626';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Submitted Essay Banner */}
      <div className="glass-card p-5 border-green-600/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 mt-0.5">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-green-300">Эссе успешно отправлено</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap mt-1">
                <span>{currentEssay.wordCount} слов</span>
                <span>·</span>
                <span>
                  Сдано {currentEssay.submittedAt ? new Date(currentEssay.submittedAt).toLocaleString() : 'недавно'}
                </span>
                {currentEssay.isExamMode && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 border border-violet-700/40 font-semibold text-[11px] flex items-center gap-1">
                    <Clock size={11} /> Симуляция экзамена ({Math.floor((currentEssay.timeSpentSeconds || 2400) / 60)} мин)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Peer Review Participation Bar */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Users size={16} className="text-violet-400" />
            Ваш вклад в проверку одноклассников
          </div>
          <span className="text-xs font-bold text-violet-300 bg-violet-900/30 border border-violet-700/30 px-2.5 py-1 rounded-lg">
            Проверено: {myReviewsGivenCount} из {assignment.requiredReviews} рекомендованных
          </span>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (myReviewsGivenCount / Math.max(1, assignment.requiredReviews)) * 100)}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            {myReviewsGivenCount >= assignment.requiredReviews ? (
              <span className="text-green-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Рекомендованный план взаимных проверок выполнен!
              </span>
            ) : (
              <span>Вы можете проверить работы других учеников и заработать дополнительные баллы XP.</span>
            )}
          </div>

          <button
            onClick={() => navigate('/reviews')}
            className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 text-xs self-start sm:self-auto"
          >
            <Users size={13} /> Все ученики во всех классах →
          </button>
        </div>

        {/* List of classmates ready for review on this assignment */}
        {availableEssaysToReview.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/40 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users size={13} className="text-violet-400" />
              Выберите ученика для проверки этого задания ({availableEssaysToReview.length}):
            </div>
            <div className="grid gap-2">
              {availableEssaysToReview.map((essay) => {
                const author = users.find((u) => u.id === essay.authorId);
                return (
                  <div
                    key={essay.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 flex-shrink-0">
                        {author?.avatar || '👤'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {author?.name || 'Одноклассник'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {essay.wordCount} слов · {essay.submittedAt ? new Date(essay.submittedAt).toLocaleDateString() : 'Сдано'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/review/${essay.id}`)}
                      className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 whitespace-nowrap"
                    >
                      <Eye size={12} /> Оценить эссе
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Received Feedback / Model Essay Section */}
      <div className="space-y-4">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('feedback')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'feedback' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <GitCompare size={14} />
            Полученная обратная связь
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/10">
              {receivedReviews.length}
            </span>
          </button>

          {modelEssay && (
            <button
              onClick={() => setViewMode('model')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'model' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              <Sparkles size={14} />
              Образец Band 9
            </button>
          )}
        </div>

        {viewMode === 'feedback' && (
          <>
            {receivedReviews.length === 0 ? (
              <div className="glass-card p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
                  <MessageSquare size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-200">Ожидание первой рецензии</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Ваше эссе доступно для взаимной проверки в классе. Как только одноклассники или преподаватель оценят работу (целиком или по отдельным критериям), результат сразу появится здесь!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Multi-review tabs if more than 1 */}
                {receivedReviews.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {receivedReviews.map((r, idx) => (
                      <button
                        key={r.id}
                        onClick={() => setActiveReviewIdx(idx)}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                          activeReviewIdx === idx ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        Рецензия #{idx + 1} · Band {r.overallBand.toFixed(1)}
                        {r.isPartial && ' (Модульная)'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Review Band Score Card */}
                {activeReview && (
                  <div className="space-y-4">
                    <div className="glass-card p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/40">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Проверяющий:</span>
                            <span className="text-xs font-bold text-slate-200">
                              {reviewerUser?.name || 'Одноклассник'}
                            </span>
                            {activeReview.editedByTeacher && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                🎓 Подтверждено преподавателем
                              </span>
                            )}
                            {activeReview.isPartial && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Модульная проверка
                              </span>
                            )}
                          </div>
                          {activeReview.contributors && activeReview.contributors.length > 1 && (
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                              <span>Соавторы рецензии:</span>
                              <span className="text-slate-300 font-medium">
                                {activeReview.contributors.map((c) => c.userName).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto">
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Итоговый Band</div>
                            <div
                              className="text-3xl font-black font-mono leading-none mt-0.5"
                              style={{ color: getBandColor(activeReview.overallBand) }}
                            >
                              {activeReview.overallBand.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4 Criteria Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Task Response', key: 'taskResponse', score: activeReview.criteria.taskResponse.band },
                          { label: 'Coherence & Cohesion', key: 'coherence', score: activeReview.criteria.coherence.band },
                          { label: 'Lexical Resource', key: 'lexicalResource', score: activeReview.criteria.lexicalResource.band },
                          { label: 'Grammar Accuracy', key: 'grammar', score: activeReview.criteria.grammar.band },
                        ].map((c) => {
                          const evalInfo = activeReview.criteriaEvaluators?.[c.key as keyof Review['criteria']];
                          return (
                            <div key={c.label} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                              <div className="text-[11px] text-slate-400 font-medium leading-tight mb-1">{c.label}</div>
                              <div className="text-lg font-black" style={{ color: getBandColor(c.score) }}>
                                {c.score.toFixed(1)}
                              </div>
                              {evalInfo && (
                                <div className="text-[10px] text-slate-500 truncate mt-1">
                                  От: {evalInfo.userName}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* General Verdict */}
                      {activeReview.generalVerdict && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/40 space-y-1.5">
                          <div className="text-xs font-bold text-slate-300">Общий вердикт рецензента:</div>
                          <p className="text-xs text-slate-300 leading-relaxed italic">
                            &ldquo;{activeReview.generalVerdict}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Interactive Text Feedback Viewer */}
                    <div className="glass-card p-5">
                      <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <MessageSquare size={14} className="text-violet-400" />
                        Инлайн-комментарии и правки в тексте эссе
                      </div>
                      <FeedbackViewer essayContent={currentEssay.content} review={activeReview} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {viewMode === 'model' && modelEssay && (
          <div className="glass-card p-5">
            <ModelEssayPanel essay={modelEssay} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeedbackView;
