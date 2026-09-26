import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AppShell from '../components/layout/AppShell';
import {
  Users, ArrowLeft, Calendar, FileText,
  AlertCircle
} from 'lucide-react';
import { mockModelEssays } from '../data/mockData';
import EssayEditor from '../components/assignment/EssayEditor';
import TeacherSubmissionsView from '../components/assignment/TeacherSubmissionsView';
import StudentFeedbackView from '../components/assignment/StudentFeedbackView';
import TeacherGradeEditModal from '../components/teacher/TeacherGradeEditModal';
import ExamSimulatorModal from '../components/assignment/ExamSimulatorModal';
import type { Review, Essay } from '../types';

const essayTypeLabel: Record<string, string> = {
  opinion: 'Opinion Essay (Task 2)',
  discussion: 'Discussion Essay (Task 2)',
  'problem-solution': 'Problem & Solution (Task 2)',
  'advantages-disadvantages': 'Advantages & Disadvantages (Task 2)',
  task1: 'Task 1 Academic (Report)',
};

const AssignmentPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const {
    currentUser, assignments, classrooms, essays, reviews, users,
    submitEssay, saveDraft, addToast,
  } = useStore();
  const navigate = useNavigate();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const classroom = assignment ? classrooms.find((c) => c.id === assignment.classroomId) : null;
  const isTeacher = currentUser?.role === 'teacher';

  const myEssay = !isTeacher
    ? essays.find((e) => e.assignmentId === assignmentId && e.authorId === currentUser?.id)
    : null;

  const [essayText, setEssayText] = useState(myEssay?.content || '');
  const [isExamModeOpen, setIsExamModeOpen] = useState(false);
  const [selectedForGradeEdit, setSelectedForGradeEdit] = useState<{ review?: Review; essay: Essay } | null>(null);

  // Sync draft content if loaded later
  useEffect(() => {
    if (myEssay?.content && !essayText) {
      setEssayText(myEssay.content);
    }
  }, [myEssay?.content]);

  if (!assignment) {
    return (
      <AppShell title="Задание не найдено">
        <div className="p-8 max-w-xl mx-auto text-center space-y-4">
          <AlertCircle size={36} className="mx-auto text-amber-400" />
          <h2 className="text-lg font-bold text-slate-200">Задание не найдено</h2>
          <p className="text-xs text-slate-400">
            Возможно, ссылка устарела или задание было удалено.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mx-auto text-xs">
            <ArrowLeft size={14} /> Вернуться в панель
          </button>
        </div>
      </AppShell>
    );
  }

  const modelEssay = mockModelEssays.find((m) => m.assignmentId === assignmentId);
  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date();
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Reviews given by current user for this assignment
  const myReviewsGiven = reviews.filter(
    (r) => r.reviewerId === currentUser?.id && r.isComplete && essays.some((e) => e.assignmentId === assignmentId && e.id === r.essayId)
  );

  // Essays available for peer review (submitted, not authored by current user)
  const availableEssaysToReview = essays.filter(
    (e) =>
      e.assignmentId === assignmentId &&
      e.authorId !== currentUser?.id &&
      e.status !== 'draft'
  );

  // Reviews received on current user's essay
  const receivedReviews = reviews.filter(
    (r) => myEssay && r.essayId === myEssay.id && r.isComplete
  );

  // Submissions for teacher
  const allSubmissions = isTeacher
    ? essays.filter((e) => e.assignmentId === assignmentId && e.status !== 'draft')
    : [];

  const handlePasteBlocked = () => {
    addToast({
      type: 'warning',
      title: 'Вставка текста заблокирована',
      message: 'По правилам IELTS эссе необходимо набирать самостоятельно для тренировки скорости и навыка письма.',
      duration: 5000,
    });
  };

  const handleSaveDraft = () => {
    if (!currentUser || !essayText.trim()) return;
    const words = essayText.trim().split(/\s+/).filter(Boolean).length;
    saveDraft({
      assignmentId: assignment.id,
      authorId: currentUser.id,
      content: essayText,
      wordCount: words,
      status: 'draft',
    });
  };

  const handleSubmitEssay = (metrics?: {
    timeSpentSeconds: number;
    keystrokesCount: number;
    pasteAttempts: number;
    averageWpm: number;
  }) => {
    if (!currentUser || !essayText.trim()) return;
    const words = essayText.trim().split(/\s+/).filter(Boolean).length;
    if (words < assignment.minWords) {
      addToast({
        type: 'warning',
        title: 'Недостаточный объем',
        message: `Минимальный объем для сдачи — ${assignment.minWords} слов. Сейчас написано ${words} слов.`,
      });
      return;
    }
    submitEssay({
      assignmentId: assignment.id,
      authorId: currentUser.id,
      content: essayText.trim(),
      wordCount: words,
      status: 'submitted',
      timeSpentSeconds: metrics?.timeSpentSeconds,
      keystrokesCount: metrics?.keystrokesCount,
      pasteAttempts: metrics?.pasteAttempts,
      averageWpm: metrics?.averageWpm,
    });
  };

  const handleSubmitExam = (examText: string, timeSpentSeconds: number) => {
    if (!currentUser || !examText.trim()) return;
    const words = examText.trim().split(/\s+/).filter(Boolean).length;
    submitEssay({
      assignmentId: assignment.id,
      authorId: currentUser.id,
      content: examText.trim(),
      wordCount: words,
      status: 'submitted',
      isExamMode: true,
      timeSpentSeconds,
      averageWpm: timeSpentSeconds > 0 ? Math.round(words / (timeSpentSeconds / 60)) : undefined,
    });
    setIsExamModeOpen(false);
  };

  return (
    <AppShell title={assignment.title}>
      <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(classroom ? `/classrooms/${classroom.id}` : '/dashboard')}
            className="btn-ghost flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft size={13} />
            {classroom ? classroom.name : 'Панель управления'}
          </button>

          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-600/15 text-violet-300 border border-violet-500/25">
            {essayTypeLabel[assignment.essayType] || assignment.essayType}
          </span>
        </div>

        {/* Assignment Prompt Card */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText size={13} />
              Экзаменационное задание
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 leading-tight">
              {assignment.title}
            </h1>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-200 text-sm leading-relaxed font-serif">
            {assignment.prompt}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-slate-500" />
              Дедлайн:{' '}
              <strong className={isOverdue ? 'text-red-400' : daysLeft <= 2 ? 'text-amber-400' : 'text-slate-300'}>
                {deadline.toLocaleDateString()} ({isOverdue ? 'Просрочено' : `осталось ${daysLeft} дн.`})
              </strong>
            </span>

            <span className="flex items-center gap-1.5">
              <FileText size={13} className="text-slate-500" />
              Минимум: <strong className="text-slate-300">{assignment.minWords} слов</strong>
            </span>

            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-slate-500" />
              Рекомендовано рецензий: <strong className="text-slate-300">{assignment.requiredReviews}</strong>
            </span>
          </div>
        </div>

        {/* Conditional View by Role & Submission Status */}
        {isTeacher ? (
          <TeacherSubmissionsView
            assignment={assignment}
            submissions={allSubmissions}
            users={users}
            reviews={reviews}
            onOpenGradeEdit={(data) => setSelectedForGradeEdit(data)}
          />
        ) : myEssay && myEssay.status !== 'draft' ? (
          <StudentFeedbackView
            assignment={assignment}
            currentEssay={myEssay}
            receivedReviews={receivedReviews}
            myReviewsGivenCount={myReviewsGiven.length}
            availableEssaysToReview={availableEssaysToReview}
            users={users}
            modelEssay={modelEssay}
          />
        ) : (
          <EssayEditor
            assignment={assignment}
            essayText={essayText}
            onChangeText={setEssayText}
            onSubmit={handleSubmitEssay}
            onSaveDraft={handleSaveDraft}
            onOpenExamSimulator={() => setIsExamModeOpen(true)}
            existingDraft={myEssay}
            onPasteBlocked={handlePasteBlocked}
          />
        )}
      </div>

      {/* Exam Simulator Fullscreen Modal */}
      {isExamModeOpen && (
        <ExamSimulatorModal
          assignment={assignment}
          initialText={essayText}
          onSaveAndExit={(savedText) => {
            setEssayText(savedText);
            setIsExamModeOpen(false);
          }}
          onSubmitExam={handleSubmitExam}
        />
      )}

      {/* Teacher Grade Edit Modal */}
      {selectedForGradeEdit && (
        <TeacherGradeEditModal
          review={selectedForGradeEdit.review}
          essay={selectedForGradeEdit.essay}
          assignment={assignment}
          onClose={() => setSelectedForGradeEdit(null)}
        />
      )}
    </AppShell>
  );
};

export default AssignmentPage;
