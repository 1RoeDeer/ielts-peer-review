import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import { FileText, PenSquare, CheckCircle2, Clock, ArrowRight, Star } from 'lucide-react';

type TabId = 'all' | 'submitted' | 'reviewed';

const EssaysPage: React.FC = () => {
  const { currentUser, essays, reviews, assignments, classrooms, users } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('all');

  const myEssays = essays.filter((e) => e.authorId === currentUser?.id);

  const filteredEssays = myEssays.filter((e) => {
    if (tab === 'submitted') return e.status === 'submitted' || e.status === 'reviewing';
    if (tab === 'reviewed') return e.status === 'reviewed';
    return true;
  }).sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

  // Stats
  const avgWords = myEssays.length
    ? Math.round(myEssays.reduce((s, e) => s + e.wordCount, 0) / myEssays.length)
    : 0;
  const receivedReviews = reviews.filter((r) => myEssays.some((e) => e.id === r.essayId) && r.isComplete);
  const bestBand = receivedReviews.length ? Math.max(...receivedReviews.map((r) => r.overallBand)) : null;
  const avgBand = receivedReviews.length
    ? receivedReviews.reduce((s, r) => s + r.overallBand, 0) / receivedReviews.length
    : null;

  const statusMeta = {
    draft:     { label: 'Draft',      color: 'var(--text-muted)',  bg: 'var(--bg-card-2)',            border: 'var(--border)' },
    submitted: { label: 'Submitted',  color: '#2563eb',            bg: 'rgba(37,99,235,0.10)',        border: 'rgba(37,99,235,0.25)' },
    reviewing: { label: 'In Review',  color: '#b45309',            bg: 'rgba(161,98,7,0.10)',         border: 'rgba(161,98,7,0.25)' },
    reviewed:  { label: 'Reviewed',   color: '#16a34a',            bg: 'rgba(22,163,74,0.10)',        border: 'rgba(22,163,74,0.25)' },
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all',       label: 'All Essays',  count: myEssays.length },
    { id: 'submitted', label: 'Pending',     count: myEssays.filter((e) => e.status === 'submitted' || e.status === 'reviewing').length },
    { id: 'reviewed',  label: 'Reviewed',    count: myEssays.filter((e) => e.status === 'reviewed').length },
  ];

  return (
    <AppShell title="My Essays">
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>My Essay Archive</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            All your submitted writing, with feedback and band scores
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText,     label: 'Total Essays',  value: myEssays.length,                          color: '#6366f1' },
            { icon: PenSquare,    label: 'Avg Word Count', value: avgWords ? `${avgWords}w` : '—',         color: '#2563eb' },
            { icon: Star,         label: 'Best Band',     value: bestBand ? bestBand.toFixed(1) : '—',     color: '#f59e0b' },
            { icon: CheckCircle2, label: 'Avg Band',      value: avgBand ? avgBand.toFixed(1) : '—',       color: '#16a34a' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="p-2 rounded-lg w-fit" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                tab === t.id ? 'border-current' : 'border-transparent'
              }`}
              style={{
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottomColor: tab === t.id ? 'var(--text-primary)' : 'transparent',
              }}
            >
              {t.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: tab === t.id ? 'var(--accent)' : 'var(--bg-card-2)',
                  color: tab === t.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Essay list */}
        {filteredEssays.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <FileText size={36} style={{ color: 'var(--border-strong)', margin: '0 auto 12px' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No essays in this category</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Submit your first essay to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEssays.map((essay) => {
              const assignment = assignments.find((a) => a.id === essay.assignmentId);
              const classroom = classrooms.find((c) => c.id === assignment?.classroomId);
              const essayReviews = reviews.filter((r) => r.essayId === essay.id && r.isComplete);
              const avgEssayBand = essayReviews.length
                ? essayReviews.reduce((s, r) => s + r.overallBand, 0) / essayReviews.length
                : null;
              const meta = statusMeta[essay.status];

              return (
                <div
                  key={essay.id}
                  className="rounded-xl overflow-hidden transition-all group"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Card header */}
                  <div className="px-5 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {assignment?.title || 'Essay'}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        {classroom?.name} · {essay.wordCount} words
                        {essay.submittedAt && ` · Submitted ${new Date(essay.submittedAt).toLocaleDateString()}`}
                      </div>
                      <p className="text-xs italic line-clamp-2 font-serif leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {essay.content.slice(0, 200)}...
                      </p>
                    </div>

                    {/* Band score */}
                    {avgEssayBand !== null && (
                      <div
                        className="flex-shrink-0 text-center px-4 py-3 rounded-xl"
                        style={{
                          background: avgEssayBand >= 7 ? 'rgba(22,163,74,0.1)' : avgEssayBand >= 5 ? 'rgba(180,83,9,0.1)' : 'rgba(220,38,38,0.1)',
                          border: `1px solid ${avgEssayBand >= 7 ? 'rgba(22,163,74,0.25)' : avgEssayBand >= 5 ? 'rgba(180,83,9,0.25)' : 'rgba(220,38,38,0.25)'}`,
                        }}
                      >
                        <div
                          className="text-2xl font-black"
                          style={{ color: avgEssayBand >= 7 ? '#16a34a' : avgEssayBand >= 5 ? '#b45309' : '#dc2626' }}
                        >
                          {avgEssayBand.toFixed(1)}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          avg band
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer with review info */}
                  {essayReviews.length > 0 && (
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card-2)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {essayReviews.length} peer review{essayReviews.length !== 1 ? 's' : ''} received:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {essayReviews.map((r) => {
                            const reviewer = users.find((u) => u.id === r.reviewerId);
                            const bc = r.overallBand >= 7 ? '#16a34a' : r.overallBand >= 5 ? '#b45309' : '#dc2626';
                            return (
                              <span
                                key={r.id}
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                                style={{ background: `${bc}15`, color: bc, border: `1px solid ${bc}30` }}
                              >
                                <span>{reviewer?.name?.split(' ')[0] || 'Peer'}: Band {r.overallBand.toFixed(1)}</span>
                                {r.editedByTeacher && <span title="Скорректировано учителем">🎓</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/assignments/${assignment?.id}`)}
                        className="btn-ghost text-xs flex items-center gap-1"
                      >
                        View feedback <ArrowRight size={11} />
                      </button>
                    </div>
                  )}

                  {/* Pending state */}
                  {essay.status === 'submitted' && essayReviews.length === 0 && (
                    <div
                      className="px-5 py-2.5 flex items-center gap-2"
                      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card-2)' }}
                    >
                      <Clock size={11} style={{ color: '#b45309' }} />
                      <span className="text-xs" style={{ color: '#b45309' }}>Awaiting peer reviews...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default EssaysPage;
