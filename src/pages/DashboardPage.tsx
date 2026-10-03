import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import {
  Users, FileText, CheckCircle2,
  Plus, ArrowRight, BookOpen, Star, AlertCircle, PenSquare,
  GraduationCap, Edit3,
} from 'lucide-react';
import CreateClassroomModal from '../components/classroom/CreateClassroomModal';
import JoinClassroomModal from '../components/classroom/JoinClassroomModal';
import TeacherGradeEditModal from '../components/teacher/TeacherGradeEditModal';
import type { Review, Essay } from '../types';

const DashboardPage: React.FC = () => {
  const { currentUser, classrooms, assignments, essays, reviews, users } = useStore();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedForGradeEdit, setSelectedForGradeEdit] = useState<{ review?: Review; essay: Essay } | null>(null);

  const isTeacher = currentUser?.role === 'teacher';

  const myClassrooms = classrooms.filter((c) =>
    isTeacher ? c.teacherId === currentUser?.id : c.studentIds.includes(currentUser?.id || '')
  );
  const myAssignments = assignments.filter((a) => myClassrooms.some((c) => c.id === a.classroomId));
  const myEssays = essays.filter((e) => e.authorId === currentUser?.id);
  const myReviews = reviews.filter((r) => r.reviewerId === currentUser?.id);
  const receivedReviews = reviews.filter((r) =>
    r.isComplete && myEssays.some((e) => e.id === r.essayId)
  );
  const allSubmissions = isTeacher
    ? essays.filter((e) => myAssignments.some((a) => a.id === e.assignmentId))
    : [];
  const reviewQueue = isTeacher ? [] : essays.filter(
    (e) =>
      e.authorId !== currentUser?.id &&
      e.status === 'submitted' &&
      !reviews.some((r) => r.essayId === e.id && r.reviewerId === currentUser?.id) &&
      myAssignments.some((a) => a.id === e.assignmentId)
  );

  const stats = isTeacher
    ? [
        { icon: Users,         label: 'My Classrooms',  value: myClassrooms.length },
        { icon: FileText,      label: 'Assignments',     value: myAssignments.length },
        { icon: PenSquare,     label: 'Submissions',     value: allSubmissions.length },
        { icon: CheckCircle2,  label: 'Reviews Done',    value: reviews.length },
      ]
    : [
        { icon: BookOpen,      label: 'My Classes',        value: myClassrooms.length },
        { icon: PenSquare,     label: 'Essays Submitted',  value: myEssays.filter((e) => e.status !== 'draft').length },
        { icon: CheckCircle2,  label: 'Reviews Given',     value: myReviews.filter((r) => r.isComplete).length },
        { icon: Star,          label: 'Avg Band Received', value: receivedReviews.length ? (receivedReviews.reduce((a, r) => a + r.overallBand, 0) / receivedReviews.length).toFixed(1) : '—' },
      ];

  const getDeadlineStatus = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days < 0) return { label: 'Overdue', color: '#dc2626' };
    if (days === 0) return { label: 'Due today', color: '#b45309' };
    if (days <= 3) return { label: `${days}d left`, color: '#b45309' };
    return { label: `${days}d left`, color: 'var(--text-muted)' };
  };

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

  return (
    <AppShell title="Dashboard">
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">

        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              Good {greeting}, {currentUser?.name.split(' ')[0]}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {isTeacher ? 'Manage your classes and track student progress.' : 'Continue your IELTS writing journey.'}
            </p>
          </div>
          <button onClick={() => isTeacher ? setShowCreateModal(true) : setShowJoinModal(true)} className="btn-primary">
            <Plus size={15} />
            {isTeacher ? 'New Classroom' : 'Join Class'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div
                className="p-2 rounded-lg w-fit"
                style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}
              >
                <s.icon size={16} style={{ color: 'var(--text-primary)' }} />
              </div>
              <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Classrooms + Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Classrooms */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isTeacher ? 'My Classrooms' : 'Enrolled Classes'}
                </h2>
                <button onClick={() => navigate('/classrooms')} className="btn-ghost text-xs">
                  View all <ArrowRight size={12} />
                </button>
              </div>

              {myClassrooms.length === 0 ? (
                <div
                  className="rounded-xl p-10 text-center"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
                >
                  <Users size={32} style={{ color: 'var(--border-strong)', margin: '0 auto 12px' }} />
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>No classrooms yet</p>
                  <button onClick={() => isTeacher ? setShowCreateModal(true) : setShowJoinModal(true)} className="btn-primary text-sm">
                    {isTeacher ? 'Create your first classroom' : 'Join a classroom'}
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {myClassrooms.map((classroom) => {
                    const ca = assignments.filter((a) => a.classroomId === classroom.id);
                    return (
                      <button
                        key={classroom.id}
                        onClick={() => navigate(`/classrooms/${classroom.id}`)}
                        className="rounded-xl p-4 text-left transition-all group"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          boxShadow: 'var(--shadow)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        }}
                      >
                        <div
                          className="w-full h-1 rounded-full mb-3"
                          style={{ background: 'var(--accent)' }}
                        />
                        <div className="text-sm font-semibold mb-1 leading-tight group-hover:text-primary" style={{ color: 'var(--text-primary)' }}>
                          {classroom.name}
                        </div>
                        <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
                          {classroom.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-1"><Users size={11} /> {classroom.studentIds.length}</span>
                            <span className="flex items-center gap-1"><FileText size={11} /> {ca.length}</span>
                          </div>
                          <code className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'var(--bg-card-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {classroom.code}
                          </code>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assignments */}
            <div>
              <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Active Assignments</h2>
              <div className="space-y-2">
                {myAssignments.slice(0, 4).map((assignment) => {
                  const cls = classrooms.find((c) => c.id === assignment.classroomId);
                  const ds = getDeadlineStatus(assignment.deadline);
                  const myEssay = !isTeacher ? myEssays.find((e) => e.assignmentId === assignment.id) : null;
                  const subCount = isTeacher ? essays.filter((e) => e.assignmentId === assignment.id).length : null;

                  return (
                    <button
                      key={assignment.id}
                      onClick={() => navigate(`/assignments/${assignment.id}`)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all group"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{assignment.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cls?.name}</div>
                      </div>
                      {isTeacher && subCount !== null && (
                        <span className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          <FileText size={11} /> {subCount} submitted
                        </span>
                      )}
                      {myEssay && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                          style={{
                            background: myEssay.status === 'reviewed' ? 'rgba(22,163,74,0.1)' : myEssay.status === 'submitted' ? 'rgba(37,99,235,0.1)' : 'var(--bg-card-2)',
                            color: myEssay.status === 'reviewed' ? '#16a34a' : myEssay.status === 'submitted' ? '#2563eb' : 'var(--text-muted)',
                            border: `1px solid ${myEssay.status === 'reviewed' ? 'rgba(22,163,74,0.25)' : myEssay.status === 'submitted' ? 'rgba(37,99,235,0.25)' : 'var(--border)'}`,
                          }}
                        >
                          {myEssay.status}
                        </span>
                      )}
                      <span className="text-xs flex-shrink-0 font-medium" style={{ color: ds.color }}>{ds.label}</span>
                      <ArrowRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Review Queue */}
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              {isTeacher ? 'Recent Activity' : 'Review Queue'}
            </h2>
            {!isTeacher && (
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/reviews')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40 text-left transition-all group shadow-sm hover:border-blue-500/50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/20">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                        Каталог учеников для оценки
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Выбрать кого проверить из всех классов
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {reviewQueue.length === 0 ? (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
                  >
                    <CheckCircle2 size={28} style={{ color: '#16a34a', margin: '0 auto 8px' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>All caught up!</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No essays waiting for review.</p>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'rgba(161,98,7,0.08)', border: '1px solid rgba(161,98,7,0.25)', color: '#92400e' }}
                    >
                      <AlertCircle size={13} />
                      {reviewQueue.length} essay{reviewQueue.length > 1 ? 's' : ''} awaiting review
                    </div>
                    {reviewQueue.map((essay) => {
                      const asgn = assignments.find((a) => a.id === essay.assignmentId);
                      const cls = classrooms.find((c) => c.id === asgn?.classroomId);
                      return (
                        <button
                          key={essay.id}
                          onClick={() => navigate(`/review/${essay.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                        >
                          <div className="w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0" style={{ background: 'var(--text-primary)' }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{asgn?.title}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{cls?.name}</div>
                          </div>
                          <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Reviews given */}
                {myReviews.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Мои рецензии (оценки)</p>
                    {myReviews.slice(0, 3).map((review) => {
                      const essay = essays.find((e) => e.id === review.essayId);
                      const asgn = assignments.find((a) => a.id === essay?.assignmentId);
                      const author = users.find((u) => u.id === essay?.authorId);
                      const bc = review.overallBand >= 7 ? '#16a34a' : review.overallBand >= 5 ? '#b45309' : '#dc2626';
                      return (
                        <div
                          key={review.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                        >
                          <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{asgn?.title || 'Essay review'}</div>
                            <div className="text-[11px] text-slate-400 truncate">Автор: {author?.name || 'Ученик'}</div>
                          </div>
                          <span className="text-xs font-bold" style={{ color: bc }}>Band {review.overallBand.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reviews received by student */}
                {(() => {
                  const received = reviews.filter((r) => myEssays.some((e) => e.id === r.essayId) && r.isComplete);
                  if (received.length === 0) return null;
                  return (
                    <div className="pt-2 space-y-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Полученные оценки</p>
                      {received.slice(0, 3).map((r) => {
                        const essay = myEssays.find((e) => e.id === r.essayId);
                        const asgn = assignments.find((a) => a.id === essay?.assignmentId);
                        const reviewer = users.find((u) => u.id === r.reviewerId);
                        const bc = r.overallBand >= 7 ? '#16a34a' : r.overallBand >= 5 ? '#b45309' : '#dc2626';

                        return (
                          <button
                            key={r.id}
                            onClick={() => asgn && navigate(`/assignments/${asgn.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                          >
                            <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {reviewer?.avatar || 'PR'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {asgn?.title}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                                <span>Оценил: {reviewer?.name || 'Рецензент'}</span>
                                {r.editedByTeacher && (
                                  <span className="text-[10px] text-purple-400 font-bold">· 🎓 Учитель</span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-black" style={{ color: bc }}>
                              Band {r.overallBand.toFixed(1)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {isTeacher && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Взаимные оценки студентов:</span>
                  <span className="text-xs text-purple-400 font-medium">Кликните для правки</span>
                </div>
                {reviews.filter((r) => r.isComplete).slice(0, 5).map((rev) => {
                  const essay = essays.find((e) => e.id === rev.essayId);
                  const asgn = assignments.find((a) => a.id === essay?.assignmentId);
                  const reviewer = users.find((u) => u.id === rev.reviewerId);
                  const author = users.find((u) => u.id === essay?.authorId);
                  const bc = rev.overallBand >= 7 ? '#16a34a' : rev.overallBand >= 5 ? '#b45309' : '#dc2626';

                  return (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl transition-all space-y-2"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                          {asgn?.title || 'Задание'}
                        </div>
                        <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: `${bc}18`, color: bc }}>
                          Band {rev.overallBand.toFixed(1)}
                        </span>
                      </div>

                      {/* Who rated whom */}
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="flex items-center gap-1 font-semibold text-slate-100">
                          <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-300 text-[9px] flex items-center justify-center font-bold">
                            {reviewer?.avatar || 'PR'}
                          </span>
                          <span>{reviewer?.name || 'Рецензент'}</span>
                        </div>
                        <span className="text-slate-500 font-mono text-[10px]">➔</span>
                        <div className="flex items-center gap-1 font-semibold text-slate-100">
                          <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-300 text-[9px] flex items-center justify-center font-bold">
                            {author?.avatar || 'AU'}
                          </span>
                          <span>{author?.name || 'Автор'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/30">
                        {rev.editedByTeacher ? (
                          <span className="text-[10px] text-purple-400 flex items-center gap-1 font-bold">
                            <GraduationCap size={10} /> Изменено учителем
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Peer review</span>
                        )}

                        {essay && (
                          <button
                            type="button"
                            onClick={() => setSelectedForGradeEdit({ review: rev, essay })}
                            className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                          >
                            <Edit3 size={11} /> Изменить оценку
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && <CreateClassroomModal onClose={() => setShowCreateModal(false)} />}
      {showJoinModal && <JoinClassroomModal onClose={() => setShowJoinModal(false)} />}

      {selectedForGradeEdit && (
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

export default DashboardPage;
