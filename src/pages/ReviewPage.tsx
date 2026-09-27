import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, initReviewForEssay } from '../store/useStore';
import EssayPanel from '../components/review/EssayPanel';
import CriteriaPanel from '../components/review/CriteriaPanel';
import {
  ArrowLeft, GraduationCap, MessageSquare,
  AlertCircle, FileText, Target
} from 'lucide-react';

function getBandColor(band: number): string {
  if (band >= 7) return '#16a34a';
  if (band >= 5) return '#b45309';
  return '#dc2626';
}

const ReviewPage: React.FC = () => {
  const { essayId } = useParams<{ essayId: string }>();
  const {
    currentUser, essays, assignments, classrooms, reviews, users,
    activeReview, setActiveReview,
  } = useStore();
  const navigate = useNavigate();

  const [mobileTab, setMobileTab] = useState<'essay' | 'criteria'>('essay');
  const [desktopView, setDesktopView] = useState<'split' | 'wide'>('split');

  const essay = essays.find((e) => e.id === essayId);
  const assignment = assignments.find((a) => a.id === essay?.assignmentId);
  const classroom = classrooms.find((c) => c.id === assignment?.classroomId);
  const author = users.find((u) => u.id === essay?.authorId);

  useEffect(() => {
    if (!essay || !currentUser) return;
    if (essay.authorId === currentUser.id) return; // Not allowed

    // Look for existing review on this essay (either by currentUser or by a classmate to complement)
    const existingUserReview = reviews.find(
      (r) => r.essayId === essay.id && r.reviewerId === currentUser.id && !r.isComplete
    );
    const existingAnyReview = reviews.find((r) => r.essayId === essay.id);

    if (existingUserReview) {
      setActiveReview(existingUserReview);
    } else if (!activeReview || activeReview.essayId !== essay.id) {
      setActiveReview(initReviewForEssay(essay.id, currentUser.id, existingAnyReview));
    }
  }, [essay?.id, currentUser?.id]);

  if (!essay || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="glass-card max-w-sm p-8 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-amber-400" />
          <p className="text-sm font-bold text-slate-200">Эссе не найдено</p>
          <button onClick={() => navigate('/reviews')} className="btn-primary text-xs mx-auto">
            <ArrowLeft size={13} /> Назад к списку
          </button>
        </div>
      </div>
    );
  }

  // Prevent reviewing own essay
  if (essay.authorId === currentUser?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--bg)' }}>
        <div className="glass-card max-w-md p-8 space-y-4">
          <AlertCircle size={36} className="mx-auto text-amber-400" />
          <h2 className="text-lg font-bold text-slate-100">Вы не можете оценивать собственное эссе</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Взаимное рецензирование проводится между одноклассниками. Пожалуйста, выберите работу другого студента из очереди.
          </p>
          <button onClick={() => navigate('/reviews')} className="btn-primary mx-auto text-xs py-2 px-4">
            <ArrowLeft size={14} /> К списку работ для проверки
          </button>
        </div>
      </div>
    );
  }

  const inlineCount = activeReview?.inlineComments.length || 0;
  const overallBand = activeReview?.overallBand || 5.0;
  const bc = getBandColor(overallBand);
  const selectedCriteria = activeReview?.reviewedCriteria || ['taskResponse', 'coherence', 'lexicalResource', 'grammar'];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Top Header Bar */}
      <div
        className="h-14 flex items-center justify-between px-4 flex-shrink-0 border-b"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-2.5">
            <ArrowLeft size={13} /> Назад
          </button>

          <div className="w-px h-5 bg-slate-700/50 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-sm)' }}
            >
              <GraduationCap size={13} style={{ color: 'var(--text-inverse)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                {assignment.title}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                <span>{classroom?.name}</span>
                <span>·</span>
                <span className="text-violet-300 font-medium">Автор: {author?.name || 'Ученик'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Layout Switcher */}
          <div className="hidden lg:flex items-center rounded-lg bg-slate-900/80 p-0.5 border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setDesktopView('split')}
              className={`px-2.5 py-1 rounded transition-all ${desktopView === 'split' ? 'bg-violet-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Стандарт (60/40)
            </button>
            <button
              type="button"
              onClick={() => setDesktopView('wide')}
              className={`px-2.5 py-1 rounded transition-all ${desktopView === 'wide' ? 'bg-violet-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Широкий текст (75%)
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <MessageSquare size={12} />
            <span>{inlineCount} коммент.</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/50 font-mono">
            <span className="text-slate-400 text-[10px]">Band:</span>
            <strong style={{ color: bc }} className="text-sm">{overallBand.toFixed(1)}</strong>
          </div>

          {activeReview?.isPartial && (
            <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Модульная ({selectedCriteria.length}/4)
            </span>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on screens < 768px) */}
      <div className="md:hidden flex items-center border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
        <button
          onClick={() => setMobileTab('essay')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            mobileTab === 'essay'
              ? 'border-violet-500 text-violet-300 bg-violet-600/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={13} />
          Текст эссе ({inlineCount})
        </button>

        <button
          onClick={() => setMobileTab('criteria')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            mobileTab === 'criteria'
              ? 'border-violet-500 text-violet-300 bg-violet-600/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target size={13} />
          Критерии IELTS ({overallBand.toFixed(1)})
        </button>
      </div>

      {/* Main Content: Responsive Split / Tab Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Essay Text Panel */}
        <div
          className={`flex flex-col overflow-hidden w-full ${
            desktopView === 'wide' ? 'md:w-3/4' : 'md:w-3/5'
          } border-r border-slate-800 transition-all duration-200 ${
            mobileTab === 'essay' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <EssayPanel essayText={essay.content} />
        </div>

        {/* Right: IELTS Criteria Panel */}
        <div
          className={`flex flex-col overflow-hidden w-full ${
            desktopView === 'wide' ? 'md:w-1/4' : 'md:w-2/5'
          } transition-all duration-200 ${
            mobileTab === 'criteria' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <CriteriaPanel />
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
