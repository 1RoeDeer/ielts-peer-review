import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import {
  CheckCircle2, MessageSquare, Star, Zap, Users,
  GraduationCap, Edit3, Eye, FileText, Search,
  ChevronDown, ChevronUp
} from 'lucide-react';
import TeacherGradeEditModal from '../components/teacher/TeacherGradeEditModal';
import type { Review, Essay } from '../types';

type ReviewTab = 'students' | 'queue' | 'history' | 'all_reviews';

const ReviewsPage: React.FC = () => {
  const { currentUser, essays, reviews, assignments, classrooms, users } = useStore();
  const navigate = useNavigate();

  const isTeacher = currentUser?.role === 'teacher';

  const [tab, setTab] = useState<ReviewTab>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [selectedForGradeEdit, setSelectedForGradeEdit] = useState<{ review?: Review; essay: Essay } | null>(null);

  // Enrolled classrooms
  const myClassrooms = classrooms.filter((c) =>
    isTeacher ? c.teacherId === currentUser?.id : c.studentIds.includes(currentUser?.id || '')
  );
  const myClassroomIds = myClassrooms.map((c) => c.id);
  const myAssignmentIds = assignments.filter((a) => myClassroomIds.includes(a.classroomId)).map((a) => a.id);

  // Queue: all peer essays in student's classrooms (excluding their own and drafts)
  const peerEssays = essays.filter((e) => {
    if (e.authorId === currentUser?.id) return false;
    if (e.status === 'draft') return false;
    if (myAssignmentIds.length && !myAssignmentIds.includes(e.assignmentId)) return false;
    return true;
  });

  // My completed reviews (where currentUser is reviewer or contributor)
  const myReviews = reviews.filter((r) => {
    if (!currentUser) return false;
    const isDirectReviewer = r.reviewerId === currentUser.id;
    const isContributor = r.contributors?.some((c) => c.userId === currentUser.id);
    return (isDirectReviewer || isContributor) && r.isComplete;
  });

  // Students list from relevant classrooms
  const relevantClassrooms = selectedClassroomId === 'all'
    ? myClassrooms
    : myClassrooms.filter((c) => c.id === selectedClassroomId);

  const relevantStudentIds = Array.from(new Set(relevantClassrooms.flatMap((c) => c.studentIds)));

  // Include all students who are in these classrooms, sorted alphabetically
  const studentList = users
    .filter((u) => u.role === 'student' && (relevantStudentIds.includes(u.id) || (currentUser?.role === 'student' && u.id === currentUser?.id)))
    .filter((u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Current user at the top or alphabetical
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      return a.name.localeCompare(b.name);
    });

  // Stats
  const avgBandGiven = myReviews.length
    ? myReviews.reduce((s, r) => s + r.overallBand, 0) / myReviews.length
    : null;
  const totalInlineComments = myReviews.reduce((s, r) => s + r.inlineComments.length, 0);
  const xpFromReviews = myReviews.length * 100 + totalInlineComments * 5;

  return (
    <AppShell title="Рецензирование">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-100">
            Центр взаимного рецензирования
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Выбирайте любого ученика из класса для проверки или оценивайте эссе из общей очереди
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: CheckCircle2, label: 'Проверено работ', value: myReviews.length, color: '#16a34a' },
            { icon: Star, label: 'Средний выставленный Band', value: avgBandGiven ? avgBandGiven.toFixed(1) : '—', color: '#f59e0b' },
            { icon: MessageSquare, label: 'Инлайн-комментариев', value: totalInlineComments, color: '#6366f1' },
            { icon: Zap, label: 'Заработано XP', value: `+${xpFromReviews}`, color: '#f97316' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 space-y-2">
              <div className="p-2 rounded-xl w-fit" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'students' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <Users size={14} />
            Выбор по ученикам
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/10">
              {studentList.length}
            </span>
          </button>

          {!isTeacher && (
            <button
              onClick={() => setTab('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tab === 'queue' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              <FileText size={14} />
              Все эссе в очереди
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/10">
                {peerEssays.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'history' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <CheckCircle2 size={14} />
            История моих рецензий
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/10">
              {myReviews.length}
            </span>
          </button>

          {isTeacher && (
            <button
              onClick={() => setTab('all_reviews')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tab === 'all_reviews' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              <GraduationCap size={14} />
              Все рецензии класса ({reviews.length})
            </button>
          )}
        </div>

        {/* 1. STUDENTS DIRECTORY TAB */}
        {tab === 'students' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск ученика по имени или email..."
                  className="input-field pl-9 text-xs sm:text-sm py-2"
                />
              </div>

              {myClassrooms.length > 1 && (
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="input-field text-xs py-2 px-3 w-auto self-start sm:self-auto"
                >
                  <option value="all">Все мои классы</option>
                  {myClassrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {studentList.length === 0 ? (
              <div className="glass-card p-10 text-center space-y-2">
                <Users size={32} className="mx-auto text-slate-500" />
                <p className="text-sm font-semibold text-slate-300">Ученики не найдены</p>
                <p className="text-xs text-slate-500">Попробуйте изменить поисковый запрос</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {studentList.map((student) => {
                  const isMe = student.id === currentUser?.id;
                  const studentEssays = essays.filter(
                    (e) => e.authorId === student.id && e.status !== 'draft'
                  );
                  const isExpanded = expandedStudentId === student.id || studentList.length === 1;

                  // Count essays ready for review
                  const reviewableCount = isMe
                    ? 0
                    : studentEssays.filter((e) => {
                        const essayReviews = reviews.filter((r) => r.essayId === e.id);
                        return !essayReviews.some((r) => r.reviewerId === currentUser?.id);
                      }).length;

                  return (
                    <div
                      key={student.id}
                      className={`glass-card transition-all overflow-hidden ${
                        isMe ? 'border-blue-500/30 bg-blue-950/15' : 'hover:border-slate-600'
                      }`}
                    >
                      {/* Student Header Card */}
                      <div
                        onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                              isMe
                                ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-200 border-slate-700'
                            }`}
                          >
                            {student.avatar}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-100">{student.name}</span>
                              {isMe && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                                  Вы
                                </span>
                              )}
                              {reviewableCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  {reviewableCount} эссе ждет оценки
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{student.email}</div>
                          </div>
                        </div>

                        {/* Right stats & expand button */}
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="text-right text-xs">
                            <span className="font-bold text-slate-200">{studentEssays.length}</span>{' '}
                            <span className="text-slate-400">
                              {studentEssays.length === 1 ? 'сданное эссе' : 'сданных эссе'}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Essays of this Student */}
                      {isExpanded && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-700/40 bg-slate-900/30 space-y-2.5">
                          {studentEssays.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2 text-center">
                              Ученик пока не сдал ни одного эссе по текущим заданиям.
                            </p>
                          ) : (
                            studentEssays.map((essay) => {
                              const assignment = assignments.find((a) => a.id === essay.assignmentId);
                              const essayReviews = reviews.filter((r) => r.essayId === essay.id && r.isComplete);
                              const hasMyReview = essayReviews.some((r) => r.reviewerId === currentUser?.id);
                              const existingReview = essayReviews[0];
                              const avgBand = essayReviews.length
                                ? (essayReviews.reduce((sum, r) => sum + r.overallBand, 0) / essayReviews.length).toFixed(1)
                                : null;

                              return (
                                <div
                                  key={essay.id}
                                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-slate-200">
                                        {assignment?.title || 'Задание'}
                                      </span>
                                      {existingReview?.isPartial && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                          Модульная проверка
                                        </span>
                                      )}
                                      {hasMyReview && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/15 text-green-300 border border-green-500/25 flex items-center gap-1">
                                          <CheckCircle2 size={10} /> Проверено вами
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                      <span>{essay.wordCount} слов</span>
                                      <span>·</span>
                                      <span>{essay.submittedAt ? new Date(essay.submittedAt).toLocaleDateString() : '—'}</span>
                                      {avgBand && (
                                        <>
                                          <span>·</span>
                                          <span className="text-amber-400 font-bold flex items-center gap-1">
                                            <Star size={10} /> Band {avgBand}
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    <p className="text-xs text-slate-400 font-serif italic line-clamp-1">
                                      &ldquo;{essay.content.slice(0, 140)}...&rdquo;
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                                    {isMe ? (
                                      <span className="text-[11px] text-slate-500 italic px-2 py-1">
                                        Ваша работа
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => navigate(`/review/${essay.id}`)}
                                        className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 whitespace-nowrap"
                                      >
                                        <Eye size={12} />
                                        {existingReview?.isPartial
                                          ? 'Дополнить оценку'
                                          : hasMyReview
                                          ? 'Проверить повторно'
                                          : 'Оценить эссе'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. QUEUE TAB (All Essays) */}
        {tab === 'queue' && (
          <div className="space-y-4">
            {peerEssays.length === 0 ? (
              <div className="glass-card p-12 text-center space-y-3">
                <CheckCircle2 size={36} className="mx-auto text-green-400" />
                <h3 className="text-base font-bold text-slate-200">Очередь проверок пуста!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Все сданные эссе в ваших классах уже проверены, либо одноклассники еще пишут свои работы. Загляните позже!
                </p>
              </div>
            ) : (
              peerEssays.map((essay) => {
                const assignment = assignments.find((a) => a.id === essay.assignmentId);
                const classroom = classrooms.find((c) => c.id === assignment?.classroomId);
                const author = users.find((u) => u.id === essay.authorId);
                const essayReviews = reviews.filter((r) => r.essayId === essay.id);
                const existingReview = essayReviews[0];
                const hasMyReview = essayReviews.some((r) => r.reviewerId === currentUser?.id);

                return (
                  <div
                    key={essay.id}
                    className="glass-card p-5 hover:border-slate-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-300 font-semibold border border-blue-500/30">
                          {classroom?.name || 'Класс'}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {assignment?.title || 'Задание'}
                        </span>
                        {existingReview?.isPartial ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                            ⚡ Модульная проверка: оценено {existingReview.reviewedCriteria?.length || 1} из 4 критериев
                          </span>
                        ) : essayReviews.length > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                            Рецензий: {essayReviews.length}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/15 text-green-300 border border-green-500/25">
                            Ожидает первой проверки
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Автор: <strong className="text-slate-200">{author?.name || 'Ученик'}</strong></span>
                        <span>·</span>
                        <span>{essay.wordCount} слов</span>
                        <span>·</span>
                        <span>{essay.submittedAt ? new Date(essay.submittedAt).toLocaleDateString() : '—'}</span>
                        {essay.isExamMode && (
                          <span className="text-blue-400 font-medium">⏱️ Exam Simulation</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 font-serif italic line-clamp-2">
                        &ldquo;{essay.content.slice(0, 180)}...&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
                          <Zap size={12} /> +100 XP
                        </div>
                        <div className="text-[10px] text-slate-500">За рецензию</div>
                      </div>

                      <button
                        onClick={() => navigate(`/review/${essay.id}`)}
                        className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4 whitespace-nowrap"
                      >
                        <Eye size={13} />
                        {existingReview?.isPartial
                          ? 'Дополнить проверку'
                          : hasMyReview
                          ? 'Проверить повторно'
                          : 'Начать проверку'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 3. HISTORY TAB */}
        {tab === 'history' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="glass-card p-12 text-center space-y-3">
                <FileText size={36} className="mx-auto text-slate-500" />
                <h3 className="text-base font-bold text-slate-200">Вы пока не проверяли работы</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Перейдите во вкладку &ldquo;Выбор по ученикам&rdquo;, чтобы сделать свою первую рецензию и заработать XP.
                </p>
              </div>
            ) : (
              myReviews.map((r) => {
                const essay = essays.find((e) => e.id === r.essayId);
                const assignment = assignments.find((a) => a.id === essay?.assignmentId);
                const classroom = classrooms.find((c) => c.id === assignment?.classroomId);
                const author = users.find((u) => u.id === essay?.authorId);

                return (
                  <div key={r.id} className="glass-card p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/40">
                      <div>
                        <div className="text-sm font-bold text-slate-100">{assignment?.title || 'Эссе'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {classroom?.name} · Автор работы: <span className="text-slate-200 font-semibold">{author?.name || 'Ученик'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Выставленный Band</div>
                          <div className="text-2xl font-black text-amber-400 font-mono">
                            {r.overallBand.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/40">
                        <div className="text-[10px] text-slate-400">TR:</div>
                        <div className="font-bold text-slate-200">{r.criteria.taskResponse.band.toFixed(1)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/40">
                        <div className="text-[10px] text-slate-400">C&C:</div>
                        <div className="font-bold text-slate-200">{r.criteria.coherence.band.toFixed(1)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/40">
                        <div className="text-[10px] text-slate-400">LR:</div>
                        <div className="font-bold text-slate-200">{r.criteria.lexicalResource.band.toFixed(1)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/40">
                        <div className="text-[10px] text-slate-400">GRA:</div>
                        <div className="font-bold text-slate-200">{r.criteria.grammar.band.toFixed(1)}</div>
                      </div>
                    </div>

                    {r.generalVerdict && (
                      <p className="text-xs text-slate-300 italic bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">
                        &ldquo;{r.generalVerdict}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 4. ALL REVIEWS TAB (Teachers) */}
        {tab === 'all_reviews' && isTeacher && (
          <div className="space-y-4">
            {reviews.map((r) => {
              const essay = essays.find((e) => e.id === r.essayId);
              const assignment = assignments.find((a) => a.id === essay?.assignmentId);
              const author = users.find((u) => u.id === essay?.authorId);
              const reviewer = users.find((u) => u.id === r.reviewerId);

              return (
                <div key={r.id} className="glass-card p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-100">{assignment?.title || 'Эссе'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Автор: <span className="text-slate-200 font-semibold">{author?.name || 'Ученик'}</span> · Проверил:{' '}
                        <span className="text-blue-300 font-semibold">{reviewer?.name || 'Рецензент'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Band:</div>
                        <div className="text-2xl font-black text-amber-400">{r.overallBand.toFixed(1)}</div>
                      </div>

                      {essay && (
                        <button
                          onClick={() => setSelectedForGradeEdit({ review: r, essay })}
                          className="btn-primary text-xs py-2 px-3"
                        >
                          <Edit3 size={12} /> Изменить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Teacher Grade Edit Modal */}
      {selectedForGradeEdit && selectedForGradeEdit.essay && (
        <TeacherGradeEditModal
          review={selectedForGradeEdit.review}
          essay={selectedForGradeEdit.essay}
          assignment={assignments.find((a) => a.id === selectedForGradeEdit.essay.assignmentId)!}
          onClose={() => setSelectedForGradeEdit(null)}
        />
      )}
    </AppShell>
  );
};

export default ReviewsPage;
