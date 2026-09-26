import React from 'react';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import { Star, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import type { ErrorCategory } from '../types';

// ─── SVG Radar Chart ────────────────────────────────────────────────────────
interface RadarProps {
  scores: { label: string; shortLabel: string; value: number }[];
  size?: number;
  maxValue?: number;
}

function RadarChart({ scores, size = 260, maxValue = 9 }: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const n = scores.length;
  const ringLevels = [2, 4, 6, 8, 9];

  const getPoint = (value: number, angleIdx: number) => {
    const angle = (Math.PI * 2 * angleIdx) / n - Math.PI / 2;
    const r = (value / maxValue) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const dataPoints = scores.map((s, i) => getPoint(s.value, i));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
        </radialGradient>
      </defs>

      {/* Grid rings */}
      {ringLevels.map((level) => {
        const ringPoints = scores.map((_, i) => getPoint(level, i));
        const ringPolygon = ringPoints.map((p) => `${p.x},${p.y}`).join(' ');
        return (
          <polygon
            key={level}
            points={ringPolygon}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {scores.map((_, i) => {
        const outer = getPoint(maxValue, i);
        return (
          <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--border)" strokeWidth="1" />
        );
      })}

      {/* Data polygon */}
      <polygon points={dataPolygon} fill="url(#radarFill)" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5} fill="#6366f1" stroke="var(--bg-card)" strokeWidth="2" />
      ))}

      {/* Band value labels near dots */}
      {dataPoints.map((p, i) => (
        <text
          key={`val-${i}`}
          x={p.x}
          y={p.y - 10}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={scores[i].value >= 7 ? '#16a34a' : scores[i].value >= 5 ? '#b45309' : '#dc2626'}
        >
          {scores[i].value.toFixed(1)}
        </text>
      ))}

      {/* Axis labels */}
      {scores.map((s, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const labelR = maxR + 22;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text
            key={`label-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="600"
            fill="var(--text-muted)"
          >
            {s.shortLabel}
          </text>
        );
      })}

      {/* Ring value labels (right axis) */}
      {ringLevels.map((level) => {
        const p = getPoint(level, 1); // place along second axis
        return (
          <text key={`rl-${level}`} x={p.x + 4} y={p.y} fontSize="8" fill="var(--text-muted)" dominantBaseline="middle">
            {level}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG Line Chart ─────────────────────────────────────────────────────────
interface LineChartProps {
  points: { date: string; band: number }[];
  width?: number;
  height?: number;
}

function LineChart({ points, width = 480, height = 180 }: LineChartProps) {
  if (points.length === 0) return null;
  const pad = { top: 20, right: 20, bottom: 40, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const minBand = 4;
  const maxBand = 9;

  const px = (i: number) => pad.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const py = (band: number) => pad.top + ((maxBand - band) / (maxBand - minBand)) * innerH;

  const polyline = points.map((p, i) => `${px(i)},${py(p.band)}`).join(' ');

  const gridLines = [5, 6, 7, 8, 9];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((band) => (
        <g key={band}>
          <line x1={pad.left} x2={width - pad.right} y1={py(band)} y2={py(band)} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" />
          <text x={pad.left - 4} y={py(band)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="var(--text-muted)">{band}</text>
        </g>
      ))}

      {/* Area fill */}
      {points.length > 1 && (
        <polygon
          points={`${px(0)},${py(minBand)} ${polyline} ${px(points.length - 1)},${py(minBand)}`}
          fill="url(#areaGradient)"
        />
      )}

      {/* Line */}
      {points.length > 1 && (
        <polyline points={polyline} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Dots + tooltips */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={px(i)} cy={py(p.band)} r={5} fill={p.band >= 7 ? '#16a34a' : p.band >= 5 ? '#b45309' : '#dc2626'} stroke="var(--bg-card)" strokeWidth="2" />
          <text x={px(i)} y={py(p.band) - 10} textAnchor="middle" fontSize="9" fontWeight="700"
            fill={p.band >= 7 ? '#16a34a' : p.band >= 5 ? '#b45309' : '#dc2626'}>
            {p.band.toFixed(1)}
          </text>
          <text x={px(i)} y={height - pad.bottom + 14} textAnchor="middle" fontSize="8" fill="var(--text-muted)">
            {new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const ResultsPage: React.FC = () => {
  const { currentUser, essays, reviews, assignments, classrooms } = useStore();

  const isTeacher = currentUser?.role === 'teacher';
  const myEssays = essays.filter((e) => e.authorId === currentUser?.id);
  const myReviews = reviews.filter((r) => r.reviewerId === currentUser?.id && r.isComplete);

  // All reviews received on MY essays
  const receivedReviews = reviews.filter(
    (r) => myEssays.some((e) => e.id === r.essayId) && r.isComplete
  );

  // Aggregate criterion scores
  const avgCriteria = receivedReviews.length > 0
    ? {
        taskResponse: receivedReviews.reduce((s, r) => s + r.criteria.taskResponse.band, 0) / receivedReviews.length,
        coherence: receivedReviews.reduce((s, r) => s + r.criteria.coherence.band, 0) / receivedReviews.length,
        lexicalResource: receivedReviews.reduce((s, r) => s + r.criteria.lexicalResource.band, 0) / receivedReviews.length,
        grammar: receivedReviews.reduce((s, r) => s + r.criteria.grammar.band, 0) / receivedReviews.length,
      }
    : { taskResponse: 6.0, coherence: 6.0, lexicalResource: 6.0, grammar: 6.0 };

  // Band progress over time
  const bandTimeline = receivedReviews
    .filter((r) => {
      const essay = myEssays.find((e) => e.id === r.essayId);
      return essay?.submittedAt;
    })
    .sort((a, b) => {
      const dateA = myEssays.find((e) => e.id === a.essayId)?.submittedAt || '';
      const dateB = myEssays.find((e) => e.id === b.essayId)?.submittedAt || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    })
    .map((r) => ({
      date: myEssays.find((e) => e.id === r.essayId)?.submittedAt || new Date().toISOString(),
      band: r.overallBand,
    }));

  // Error category breakdown
  const allInlineComments = receivedReviews.flatMap((r) => r.inlineComments);
  const categoryBreakdown: Record<ErrorCategory, number> = { grammar: 0, vocabulary: 0, punctuation: 0, style: 0 };
  allInlineComments.forEach((c) => { categoryBreakdown[c.category]++; });
  const totalComments = allInlineComments.length || 1;

  const categoryColors: Record<ErrorCategory, { dot: string; bg: string; label: string }> = {
    grammar:     { dot: '#dc2626', bg: 'rgba(220,38,38,0.10)',   label: 'Grammar' },
    vocabulary:  { dot: '#2563eb', bg: 'rgba(37,99,235,0.10)',   label: 'Vocabulary' },
    punctuation: { dot: '#b45309', bg: 'rgba(161,98,7,0.10)',    label: 'Punctuation' },
    style:       { dot: '#7c3aed', bg: 'rgba(109,40,217,0.10)',  label: 'Style' },
  };

  const bestBand = receivedReviews.length ? Math.max(...receivedReviews.map((r) => r.overallBand)) : 0;
  const avgBand = receivedReviews.length ? receivedReviews.reduce((s, r) => s + r.overallBand, 0) / receivedReviews.length : 0;

  const myClassrooms = classrooms.filter((c) =>
    isTeacher ? c.teacherId === currentUser?.id : c.studentIds.includes(currentUser?.id || '')
  );
  const myAssignments = assignments.filter((a) => myClassrooms.some((c) => c.id === a.classroomId));

  const radarData = [
    { label: 'Task Response', shortLabel: 'TR', value: avgCriteria.taskResponse },
    { label: 'Coherence & Cohesion', shortLabel: 'C&C', value: avgCriteria.coherence },
    { label: 'Lexical Resource', shortLabel: 'LR', value: avgCriteria.lexicalResource },
    { label: 'Grammar', shortLabel: 'GRA', value: avgCriteria.grammar },
  ];

  return (
    <AppShell title="My Results">
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Performance Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Your IELTS writing progress across all assignments
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Star,         label: 'Best Band Score',   value: bestBand ? bestBand.toFixed(1) : '—', color: '#f59e0b' },
            { icon: TrendingUp,   label: 'Average Band',      value: avgBand ? avgBand.toFixed(1) : '—',  color: '#6366f1' },
            { icon: FileText,     label: 'Essays Submitted',  value: myEssays.filter((e) => e.status !== 'draft').length, color: '#2563eb' },
            { icon: CheckCircle2, label: 'Reviews Given',     value: myReviews.length, color: '#16a34a' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div
                className="p-2 rounded-lg w-fit"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
              >
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          >
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Criterion Breakdown
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {receivedReviews.length > 0 ? 'Average across all received reviews' : 'No reviews received yet — showing example data'}
            </p>
            <div className="flex justify-center">
              <RadarChart scores={radarData} size={260} />
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {radarData.map((d) => (
                <div key={d.label} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.shortLabel}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: d.value >= 7 ? '#16a34a' : d.value >= 5 ? '#b45309' : '#dc2626' }}
                  >
                    {d.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Band Progress Line Chart */}
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          >
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Band Score Progress
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {bandTimeline.length > 0 ? 'Band score received over time' : 'Submit and receive reviews to see your progress'}
            </p>
            {bandTimeline.length > 0 ? (
              <LineChart points={bandTimeline} />
            ) : (
              <div
                className="flex items-center justify-center h-40 rounded-xl"
                style={{ background: 'var(--bg-card-2)', border: '1px dashed var(--border)' }}
              >
                <div className="text-center">
                  <TrendingUp size={28} style={{ color: 'var(--border-strong)', margin: '0 auto 8px' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    No data yet — complete peer reviews to track progress
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Category Breakdown */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Error Analysis
          </h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            {allInlineComments.length > 0
              ? `Based on ${allInlineComments.length} inline comments from peer reviewers`
              : 'No inline comments received yet'}
          </p>
          <div className="space-y-3">
            {(Object.entries(categoryBreakdown) as [ErrorCategory, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const pct = Math.round((count / totalComments) * 100);
                const cfg = categoryColors[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.dot }} />
                        <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{count} comment{count !== 1 ? 's' : ''}</span>
                        <span className="text-sm font-bold w-10 text-right" style={{ color: cfg.dot }}>{allInlineComments.length > 0 ? pct : 0}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${allInlineComments.length > 0 ? pct : 0}%`,
                          background: cfg.dot,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          {allInlineComments.length === 0 && (
            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              Submit an essay and receive peer reviews with inline comments to see your error breakdown.
            </p>
          )}
        </div>

        {/* Assignment performance table */}
        {myAssignments.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Assignment Performance</h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {myAssignments.map((a) => {
                const myEssay = myEssays.find((e) => e.assignmentId === a.id);
                const essayReviews = myEssay ? reviews.filter((r) => r.essayId === myEssay.id && r.isComplete) : [];
                const avgBandForEssay = essayReviews.length
                  ? essayReviews.reduce((s, r) => s + r.overallBand, 0) / essayReviews.length
                  : null;
                const cls = classrooms.find((c) => c.id === a.classroomId);
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{cls?.name}</div>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {myEssay ? `${myEssay.wordCount} words` : 'Not submitted'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {essayReviews.length} review{essayReviews.length !== 1 ? 's' : ''}
                    </div>
                    {avgBandForEssay !== null ? (
                      <span
                        className="text-sm font-bold px-2.5 py-1 rounded-lg"
                        style={{
                          background: avgBandForEssay >= 7 ? 'rgba(22,163,74,0.1)' : avgBandForEssay >= 5 ? 'rgba(180,83,9,0.1)' : 'rgba(220,38,38,0.1)',
                          color: avgBandForEssay >= 7 ? '#16a34a' : avgBandForEssay >= 5 ? '#b45309' : '#dc2626',
                        }}
                      >
                        Band {avgBandForEssay.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ResultsPage;
