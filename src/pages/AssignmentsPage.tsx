import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import { BookOpen, Filter, ChevronRight, PenSquare, CheckCircle2, Clock } from 'lucide-react';
import type { EssayType } from '../types';

type FilterType = 'all' | EssayType;
type FilterStatus = 'all' | 'not_started' | 'submitted' | 'reviewed';

const TYPE_LABELS: Record<string, string> = {
  opinion: 'Opinion Essay',
  discussion: 'Discussion Essay',
  'problem-solution': 'Problem & Solution',
  'advantages-disadvantages': 'Advantages & Disadvantages',
  task1: 'Task 1',
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  opinion:                 { bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.25)',  text: '#6366f1' },
  discussion:              { bg: 'rgba(37,99,235,0.10)',   border: 'rgba(37,99,235,0.25)',   text: '#2563eb' },
  'problem-solution':      { bg: 'rgba(22,163,74,0.10)',   border: 'rgba(22,163,74,0.25)',   text: '#16a34a' },
  'advantages-disadvantages': { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
  task1:                   { bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.25)',   text: '#dc2626' },
};

const AssignmentsPage: React.FC = () => {
  const { currentUser, essays, assignments, classrooms, reviews } = useStore();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const isTeacher = currentUser?.role === 'teacher';
  const myClassrooms = classrooms.filter((c) =>
    isTeacher ? c.teacherId === currentUser?.id : c.studentIds.includes(currentUser?.id || '')
  );
  const myAssignments = assignments.filter((a) => myClassrooms.some((c) => c.id === a.classroomId));

  const myEssays = essays.filter((e) => e.authorId === currentUser?.id);

  const getAssignmentStatus = (assignmentId: string): FilterStatus => {
    const essay = myEssays.find((e) => e.assignmentId === assignmentId);
    if (!essay) return 'not_started';
    if (essay.status === 'reviewed') return 'reviewed';
    return 'submitted';
  };

  const filtered = myAssignments.filter((a) => {
    const typeMatch = typeFilter === 'all' || a.essayType === typeFilter;
    const statusMatch = statusFilter === 'all' || getAssignmentStatus(a.id) === statusFilter;
    return typeMatch && statusMatch;
  });

  const allTypes = [...new Set(myAssignments.map((a) => a.essayType))];

  const statusConfig: Record<FilterStatus, { label: string; color: string; bg: string; border: string }> = {
    all:         { label: 'All', color: 'var(--text-muted)', bg: 'var(--bg-card-2)', border: 'var(--border)' },
    not_started: { label: 'Not Started', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
    submitted:   { label: 'Submitted', color: '#2563eb', bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.25)' },
    reviewed:    { label: 'Reviewed', color: '#16a34a', bg: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.25)' },
  };

  return (
    <AppShell title="Assignments">
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Assignment Catalogue
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} assignment{filtered.length !== 1 ? 's' : ''} across {myClassrooms.length} classroom{myClassrooms.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="section-label">Filters</span>
          </div>
          <div className="space-y-2">
            {/* Type filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs self-center" style={{ color: 'var(--text-muted)', minWidth: '50px' }}>Type:</span>
              {(['all', ...allTypes] as FilterType[]).map((t) => {
                const isActive = typeFilter === t;
                const typeCfg = t !== 'all' ? TYPE_COLORS[t] : null;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{
                      background: isActive ? (typeCfg?.bg || 'var(--accent)') : 'var(--bg-card-2)',
                      color: isActive ? (typeCfg?.text || 'var(--text-inverse)') : 'var(--text-muted)',
                      border: `1px solid ${isActive ? (typeCfg?.border || 'var(--accent)') : 'var(--border)'}`,
                    }}
                  >
                    {t === 'all' ? 'All Types' : TYPE_LABELS[t] || t}
                  </button>
                );
              })}
            </div>
            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs self-center" style={{ color: 'var(--text-muted)', minWidth: '50px' }}>Status:</span>
              {(['all', 'not_started', 'submitted', 'reviewed'] as FilterStatus[]).map((s) => {
                const cfg = statusConfig[s];
                const isActive = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{
                      background: isActive ? cfg.bg : 'var(--bg-card-2)',
                      color: isActive ? cfg.color : 'var(--text-muted)',
                      border: `1px solid ${isActive ? cfg.border : 'var(--border)'}`,
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assignment list */}
        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <BookOpen size={36} style={{ color: 'var(--border-strong)', margin: '0 auto 12px' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No assignments found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered
              .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
              .map((assignment) => {
                const classroom = classrooms.find((c) => c.id === assignment.classroomId);
                const myEssay = myEssays.find((e) => e.assignmentId === assignment.id);
                const assignStatus = getAssignmentStatus(assignment.id);
                const statusCfg = statusConfig[assignStatus];
                const typeCfg = TYPE_COLORS[assignment.essayType] || TYPE_COLORS['opinion'];
                const typeLabel = TYPE_LABELS[assignment.essayType] || assignment.essayType;
                const essayReviews = myEssay ? reviews.filter((r) => r.essayId === myEssay.id && r.isComplete) : [];

                // Deadline
                const daysLeft = (new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                const deadlineUrgent = daysLeft < 3;
                const deadlineSoon = daysLeft < 7;

                return (
                  <div
                    key={assignment.id}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
                  >
                    <div className="px-5 py-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {assignment.title}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: typeCfg.bg, color: typeCfg.text, border: `1px solid ${typeCfg.border}` }}
                          >
                            {typeLabel}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                          {classroom?.name}
                          {assignment.minWords && ` · Min ${assignment.minWords} words`}
                          {myEssay && ` · Your essay: ${myEssay.wordCount} words`}
                        </div>
                        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {assignment.prompt}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-right space-y-1">
                        {/* Deadline */}
                        <div
                          className="flex items-center gap-1 text-xs font-medium"
                          style={{ color: deadlineUrgent ? '#dc2626' : deadlineSoon ? '#b45309' : 'var(--text-muted)' }}
                        >
                          <Clock size={11} />
                          {daysLeft < 0
                            ? 'Overdue'
                            : daysLeft < 1
                            ? 'Due today'
                            : `${Math.ceil(daysLeft)}d left`}
                        </div>
                        {/* Reviews received */}
                        {essayReviews.length > 0 && (
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {essayReviews.length} review{essayReviews.length !== 1 ? 's' : ''} received
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deadline progress bar */}
                    {daysLeft > 0 && (
                      <div className="px-5 pb-2">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(5, Math.min(100, (1 - daysLeft / 14) * 100))}%`,
                              background: deadlineUrgent ? '#dc2626' : deadlineSoon ? '#b45309' : '#16a34a',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card-2)' }}
                    >
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Due: {new Date(assignment.deadline).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <button
                        onClick={() => navigate(`/assignments/${assignment.id}`)}
                        className={`flex items-center gap-2 text-xs font-semibold ${assignStatus === 'not_started' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 14px' }}
                      >
                        {assignStatus === 'not_started' ? (
                          <><PenSquare size={12} /> Write Essay</>
                        ) : assignStatus === 'reviewed' ? (
                          <><CheckCircle2 size={12} /> View Feedback</>
                        ) : (
                          <><BookOpen size={12} /> View Submission</>
                        )}
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default AssignmentsPage;
