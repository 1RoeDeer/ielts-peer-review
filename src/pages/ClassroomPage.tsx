import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import {
  Users, FileText, Plus, ArrowRight, Calendar, Clock,
  Copy, Check, BookOpen, BarChart3, ChevronDown, ChevronUp,
  Eye, CheckCircle2, Search, Star,
} from 'lucide-react';
import CreateAssignmentModal from '../components/classroom/CreateAssignmentModal';

const ClassroomPage: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { currentUser, classrooms, assignments, essays, reviews, users } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'assignments' | 'students' | 'analytics'>('assignments');
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  const classroom = classrooms.find((c) => c.id === classroomId);
  if (!classroom) return (
    <AppShell>
      <div className="p-8 text-slate-500">Classroom not found.</div>
    </AppShell>
  );

  const isTeacher = currentUser?.role === 'teacher' && classroom.teacherId === currentUser.id;
  const classAssignments = assignments.filter((a) => a.classroomId === classroomId);
  const students = users.filter((u) => classroom.studentIds.includes(u.id));

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDeadlineStatus = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days < 0) return { label: 'Overdue', color: 'text-red-400' };
    if (days === 0) return { label: 'Due today', color: 'text-orange-400' };
    return { label: `${days}d left`, color: days <= 3 ? 'text-yellow-400' : 'text-slate-500' };
  };

  const essayTypeColors: Record<string, string> = {
    opinion: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
    discussion: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
    'problem-solution': 'bg-orange-900/40 text-orange-300 border-orange-700/40',
    'advantages-disadvantages': 'bg-teal-900/40 text-teal-300 border-teal-700/40',
    task1: 'bg-pink-900/40 text-pink-300 border-pink-700/40',
  };

  return (
    <AppShell title={classroom.name}>
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Classroom header */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{classroom.name}</h1>
              <p className="text-sm text-slate-400">{classroom.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600/40">
                <code className="text-sm font-mono text-blue-300">{classroom.code}</code>
                <button onClick={handleCopyCode} className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded">
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Users size={14} /> {students.length} students</span>
            <span className="flex items-center gap-1.5"><FileText size={14} /> {classAssignments.length} assignments</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> Created {new Date(classroom.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-700/40">
          {[
            { key: 'assignments', label: 'Assignments', icon: FileText },
            { key: 'students', label: 'Students', icon: Users },
            ...(isTeacher ? [{ key: 'analytics', label: 'Analytics', icon: BarChart3 }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                tab === key
                  ? 'border-blue-500 text-blue-300 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Assignments tab */}
        {tab === 'assignments' && (
          <div className="space-y-4">
            {isTeacher && (
              <div className="flex justify-end">
                <button onClick={() => setShowCreateAssignment(true)} className="btn-primary flex items-center gap-2">
                  <Plus size={16} /> Create Assignment
                </button>
              </div>
            )}

            {classAssignments.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <BookOpen size={36} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No assignments yet.</p>
                {isTeacher && (
                  <button onClick={() => setShowCreateAssignment(true)} className="btn-primary mt-4 text-sm">
                    Create first assignment
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {classAssignments.map((assignment) => {
                  const ds = getDeadlineStatus(assignment.deadline);
                  const submittedCount = essays.filter((e) => e.assignmentId === assignment.id).length;
                  const myEssay = !isTeacher ? essays.find(
                    (e) => e.assignmentId === assignment.id && e.authorId === currentUser?.id
                  ) : null;

                  return (
                    <button
                      key={assignment.id}
                      onClick={() => navigate(`/assignments/${assignment.id}`)}
                      className="glass-card w-full text-left flex items-start gap-4 p-5 hover:border-slate-600/60 hover:scale-[1.005] transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white">{assignment.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${essayTypeColors[assignment.essayType] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {assignment.essayType.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{assignment.prompt.slice(0, 120)}...</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><BookOpen size={11} /> Min {assignment.minWords} words</span>
                          <span className="flex items-center gap-1"><Users size={11} /> {assignment.requiredReviews} reviews required</span>
                          {isTeacher && <span className="flex items-center gap-1"><FileText size={11} /> {submittedCount}/{students.length} submitted</span>}
                          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(assignment.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium ${ds.color}`}>{ds.label}</span>
                        {myEssay && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            myEssay.status === 'reviewed' ? 'bg-green-900/40 text-green-400' :
                            myEssay.status === 'submitted' ? 'bg-blue-900/40 text-blue-400' :
                            'bg-slate-800 text-slate-500'
                          }`}>{myEssay.status}</span>
                        )}
                        <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Students tab */}
        {tab === 'students' && (
          <div className="space-y-4">
            {/* Header / Info bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Поиск ученика по имени или email..."
                  className="input-field pl-9 text-xs sm:text-sm py-2"
                />
              </div>
              <div className="text-xs text-slate-400 self-center">
                Всего учеников: <span className="font-bold text-slate-200">{filteredStudents.length}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs text-blue-300 flex items-center gap-2">
              <Users size={14} className="text-blue-400 flex-shrink-0" />
              <span>
                Нажмите на ученика, чтобы просмотреть его эссе по этому классу и перейти к взаимному оцениванию.
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-500 text-sm">
                {students.length === 0 ? (
                  <>
                    No students have joined yet. Share code <code className="text-blue-400">{classroom.code}</code>.
                  </>
                ) : (
                  'Ученики по заданному запросу не найдены.'
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const isMe = student.id === currentUser?.id;
                  const studentEssays = essays.filter(
                    (e) => e.authorId === student.id && classAssignments.some((a) => a.id === e.assignmentId) && e.status !== 'draft'
                  );
                  const isExpanded = expandedStudentId === student.id || filteredStudents.length === 1;

                  // Count essays ready for review by current user
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
                      {/* Student Card Header */}
                      <div
                        onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                              isMe
                                ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-200 border-slate-700'
                            }`}
                          >
                            {student.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-200">{student.name}</span>
                              {isMe && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                                  Вы
                                </span>
                              )}
                              {reviewableCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  {reviewableCount} ждет оценки
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 self-end sm:self-auto">
                          <div className="text-center">
                            <div className="font-semibold text-slate-200">{studentEssays.length}</div>
                            <div className="text-[11px] text-slate-500">сдано эссе</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-slate-200">
                              {studentEssays.filter((e) => e.status === 'reviewed').length}
                            </div>
                            <div className="text-[11px] text-slate-500">оценок получено</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-violet-400">
                              {reviews.filter((r) => r.reviewerId === student.id && r.isComplete).length}
                            </div>
                            <div className="text-[11px] text-slate-500">рецензий дано</div>
                          </div>
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Essays List */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-700/40 bg-slate-900/40 space-y-2">
                          {studentEssays.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2 text-center">
                              Ученик пока не сдал ни одного эссе по заданиям этого класса.
                            </p>
                          ) : (
                            studentEssays.map((essay) => {
                              const assignment = classAssignments.find((a) => a.id === essay.assignmentId);
                              const essayReviews = reviews.filter((r) => r.essayId === essay.id && r.isComplete);
                              const hasMyReview = essayReviews.some((r) => r.reviewerId === currentUser?.id);
                              const existingReview = essayReviews[0];
                              const avgBand = essayReviews.length
                                ? (essayReviews.reduce((sum, r) => sum + r.overallBand, 0) / essayReviews.length).toFixed(1)
                                : null;

                              return (
                                <div
                                  key={essay.id}
                                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                                      <span>
                                        {essay.submittedAt ? new Date(essay.submittedAt).toLocaleDateString() : '—'}
                                      </span>
                                      {avgBand && (
                                        <>
                                          <span>·</span>
                                          <span className="text-amber-400 font-bold flex items-center gap-1">
                                            <Star size={10} /> Band {avgBand}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                                    {isMe ? (
                                      <span className="text-[11px] text-slate-500 italic px-2 py-1">
                                        Ваша работа
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/review/${essay.id}`);
                                        }}
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

        {/* Analytics tab (teacher only) */}
        {tab === 'analytics' && isTeacher && (() => {
          const classEssays = essays.filter(e => classAssignments.some(a => a.id === e.assignmentId));
          const classReviews = reviews.filter(r => classEssays.some(e => e.id === r.essayId) && r.isComplete);
          const avgClassBand = classReviews.length > 0
            ? (classReviews.reduce((sum, r) => sum + r.overallBand, 0) / classReviews.length).toFixed(1)
            : '—';

          return (
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Submissions', value: classEssays.length, color: 'text-blue-400' },
                { label: 'Reviews Completed', value: classReviews.length, color: 'text-green-400' },
                { label: 'Avg. Band Score', value: avgClassBand !== '—' ? `Band ${avgClassBand}` : '—', color: 'text-violet-400' },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {showCreateAssignment && (
        <CreateAssignmentModal classroomId={classroomId!} onClose={() => setShowCreateAssignment(false)} />
      )}
    </AppShell>
  );
};

export default ClassroomPage;
