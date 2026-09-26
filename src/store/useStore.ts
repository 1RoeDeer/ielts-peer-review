import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User, Classroom, Assignment, Essay, Review, InlineComment, Notification, ToastMessage, Badge, ReviewerRank,
  TeacherReviewUpdate, CriterionKey, CriterionEvaluator, ReviewContributor,
} from '../types';
import {
  mockUsers, mockClassrooms, mockAssignments, mockEssays, mockReviews, mockNotifications, mockBadges,
} from '../data/mockData';
import { supabase } from '../lib/supabase';
import {
  insertClassroom, insertClassroomStudent, insertAssignment,
  upsertEssay, upsertReview, insertNotification,
  markNotificationReadDb,
} from '../lib/db';

// Safe LocalStorage wrapper to protect against QuotaExceededError and private browsing issues
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth & User Management
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: Omit<User, 'id'>) => User;
  logout: () => Promise<void>;

  // Data
  users: User[];
  classrooms: Classroom[];
  assignments: Assignment[];
  essays: Essay[];
  reviews: Review[];

  // Active review state
  activeReview: Review | null;
  setActiveReview: (review: Review | null) => void;
  setReviewedCriteria: (criteria: CriterionKey[]) => void;
  addInlineComment: (comment: InlineComment) => void;
  updateInlineComment: (id: string, updates: Partial<InlineComment>) => void;
  deleteInlineComment: (id: string) => void;
  updateReviewCriteria: (
    criterion: CriterionKey,
    updates: Partial<{ band: number; feedback: string; checklistState: Record<string, boolean> }>
  ) => void;
  updateGeneralVerdict: (verdict: string) => void;
  submitReview: () => void;

  // Teacher grade editing actions
  updateReviewByTeacher: (reviewId: string, updates: TeacherReviewUpdate) => void;
  createTeacherReview: (
    essayId: string,
    reviewData: {
      criteria: Review['criteria'];
      overallBand: number;
      generalVerdict: string;
      teacherFeedback?: string;
    }
  ) => void;
  resetDatabase: () => void;

  // Classroom actions
  createClassroom: (classroom: Omit<Classroom, 'id' | 'createdAt' | 'studentIds'>) => void;
  joinClassroom: (code: string) => { success: boolean; reason?: 'not_found' | 'already_joined' | 'teacher_owner' };

  // Assignment actions
  createAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void;

  // Essay actions
  submitEssay: (essay: Omit<Essay, 'id' | 'submittedAt'>) => void;
  saveDraft: (essay: Omit<Essay, 'id' | 'submittedAt'>) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  simulateTeacherTopicNotification: () => void;

  // Real-time Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifPanelOpen: boolean;
  setNotifPanelOpen: (open: boolean) => void;

  // Gamification
  xp: number;
  streak: number;
  lastActivityDate: string | null;
  badges: Badge[];
  reviewerRank: ReviewerRank;
  addXP: (amount: number, reason?: string) => void;
  awardBadge: (badge: Omit<Badge, 'id' | 'earnedAt'>) => void;
  checkAndUpdateStreak: () => void;
}

const defaultReview = (): Review => ({
  id: `review-${Date.now()}`,
  essayId: '',
  reviewerId: '',
  inlineComments: [],
  criteria: {
    taskResponse: { band: 5.0, feedback: '', checklistState: { allPartsAddressed: false, clearPosition: false, examplesProvided: false, adequateLength: false } },
    coherence: { band: 5.0, feedback: '', checklistState: { logicalParagraphs: false, correctLinkingWords: false, clearProgression: false } },
    lexicalResource: { band: 5.0, feedback: '', checklistState: { academicVocabulary: false, noFrequentRepetition: false, appropriateCollocations: false } },
    grammar: { band: 5.0, feedback: '', checklistState: { complexSentences: false, minimalPunctuationErrors: false } },
  },
  reviewedCriteria: ['taskResponse', 'coherence', 'lexicalResource', 'grammar'],
  criteriaEvaluators: {},
  contributors: [],
  overallBand: 5.0,
  generalVerdict: '',
  createdAt: new Date().toISOString(),
  isComplete: false,
});

export function calculateOverallBand(bands: number[]): number {
  const valid = bands.filter((b) => typeof b === 'number' && !isNaN(b) && b > 0);
  if (!valid.length) return 5.0;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const floor = Math.floor(avg);
  const decimal = avg - floor;
  if (decimal < 0.25) return floor;
  if (decimal < 0.75) return floor + 0.5;
  return floor + 1;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    return { theme: next };
  }),

  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  addUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    set((state) => ({
      users: [...state.users, newUser],
      currentUser: newUser,
    }));
    return newUser;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      currentUser: null,
      users: mockUsers,
      classrooms: mockClassrooms,
      assignments: mockAssignments,
      essays: mockEssays,
      reviews: mockReviews,
      notifications: mockNotifications,
    });
  },

  users: mockUsers,
  classrooms: mockClassrooms,
  assignments: mockAssignments,
  essays: mockEssays,
  reviews: mockReviews,
  notifications: mockNotifications,

  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  activeReview: null,
  setActiveReview: (review) => set({ activeReview: review }),

  setReviewedCriteria: (criteria) =>
    set((state) => {
      if (!state.activeReview) return state;
      const bands = criteria.map((k) => state.activeReview!.criteria[k].band);
      return {
        activeReview: {
          ...state.activeReview,
          reviewedCriteria: criteria,
          overallBand: calculateOverallBand(bands),
        },
      };
    }),

  addInlineComment: (comment) =>
    set((state) => {
      const sanitized: InlineComment = {
        ...comment,
        comment: comment.comment.slice(0, 3000),
        suggestion: comment.suggestion ? comment.suggestion.slice(0, 3000) : undefined,
        authorId: comment.authorId || state.currentUser?.id,
        authorName: comment.authorName || state.currentUser?.name,
      };
      return {
        activeReview: state.activeReview
          ? { ...state.activeReview, inlineComments: [...state.activeReview.inlineComments, sanitized] }
          : state.activeReview,
      };
    }),

  updateInlineComment: (id, updates) =>
    set((state) => {
      const sanitizedUpdates = {
        ...updates,
        ...(updates.comment ? { comment: updates.comment.slice(0, 3000) } : {}),
        ...(updates.suggestion ? { suggestion: updates.suggestion.slice(0, 3000) } : {}),
      };
      return {
        activeReview: state.activeReview
          ? {
              ...state.activeReview,
              inlineComments: state.activeReview.inlineComments.map((c) =>
                c.id === id ? { ...c, ...sanitizedUpdates } : c
              ),
            }
          : state.activeReview,
      };
    }),

  deleteInlineComment: (id) =>
    set((state) => ({
      activeReview: state.activeReview
        ? {
            ...state.activeReview,
            inlineComments: state.activeReview.inlineComments.filter((c) => c.id !== id),
          }
        : state.activeReview,
    })),

  updateReviewCriteria: (criterion, updates) =>
    set((state) => {
      if (!state.activeReview) return state;
      const sanitizedUpdates = {
        ...updates,
        ...(updates.feedback ? { feedback: updates.feedback.slice(0, 3000) } : {}),
      };
      const updatedCriteria = {
        ...state.activeReview.criteria,
        [criterion]: { ...state.activeReview.criteria[criterion], ...sanitizedUpdates },
      };

      const currentReviewed = state.activeReview.reviewedCriteria || ['taskResponse', 'coherence', 'lexicalResource', 'grammar'];
      const reviewedSet = new Set(currentReviewed);
      reviewedSet.add(criterion);
      const newReviewedCriteria = Array.from(reviewedSet) as CriterionKey[];

      const currentEvaluators = state.activeReview.criteriaEvaluators || {};
      const updatedEvaluators = {
        ...currentEvaluators,
        ...(state.currentUser ? {
          [criterion]: {
            userId: state.currentUser.id,
            userName: state.currentUser.name,
            userRole: state.currentUser.role,
            evaluatedAt: new Date().toISOString(),
            band: sanitizedUpdates.band ?? state.activeReview.criteria[criterion].band,
          },
        } : {}),
      };

      const bandsToAverage = newReviewedCriteria.map((k) => updatedCriteria[k].band);
      const newOverall = calculateOverallBand(bandsToAverage);

      return {
        activeReview: {
          ...state.activeReview,
          criteria: updatedCriteria,
          reviewedCriteria: newReviewedCriteria,
          criteriaEvaluators: updatedEvaluators,
          overallBand: newOverall,
        },
      };
    }),

  updateGeneralVerdict: (verdict) =>
    set((state) => ({
      activeReview: state.activeReview
        ? { ...state.activeReview, generalVerdict: verdict.slice(0, 3000) }
        : state.activeReview,
    })),

  submitReview: () =>
    set((state) => {
      if (!state.activeReview || !state.currentUser) return state;
      const active = state.activeReview;

      // Validation: student cannot review their own essay
      const essay = state.essays.find((e) => e.id === active.essayId);
      if (essay && essay.authorId === state.currentUser.id) {
        return {
          toasts: [
            ...state.toasts,
            {
              id: `toast-err-${Date.now()}`,
              type: 'warning',
              title: 'Недопустимое действие',
              message: 'Вы не можете оценивать собственное эссе.',
            },
          ],
        };
      }

      const activeCriteria = (active.reviewedCriteria && active.reviewedCriteria.length > 0)
        ? active.reviewedCriteria
        : (['taskResponse', 'coherence', 'lexicalResource', 'grammar'] as CriterionKey[]);

      const isPartial = activeCriteria.length < 4;
      const existingReview = state.reviews.find((r) => r.essayId === active.essayId);

      const myContrib: ReviewContributor = {
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        role: state.currentUser.role,
        criteriaAssessed: activeCriteria,
      };

      const mergedContributors = existingReview?.contributors ? [...existingReview.contributors] : [];
      const cIdx = mergedContributors.findIndex((c) => c.userId === state.currentUser!.id);
      if (cIdx >= 0) {
        const mergedAssessed = Array.from(new Set([...mergedContributors[cIdx].criteriaAssessed, ...activeCriteria])) as CriterionKey[];
        mergedContributors[cIdx] = { ...mergedContributors[cIdx], criteriaAssessed: mergedAssessed };
      } else {
        mergedContributors.push(myContrib);
      }

      const mergedEvaluators: Partial<Record<CriterionKey, CriterionEvaluator>> = {
        ...(existingReview?.criteriaEvaluators || {}),
        ...(active.criteriaEvaluators || {}),
      };
      for (const k of activeCriteria) {
        mergedEvaluators[k] = {
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          userRole: state.currentUser.role,
          evaluatedAt: new Date().toISOString(),
          band: active.criteria[k].band,
        };
      }

      const allEvaluatedKeys = Object.keys(mergedEvaluators) as CriterionKey[];
      const fullyAssessed = ['taskResponse', 'coherence', 'lexicalResource', 'grammar'].every((k) =>
        allEvaluatedKeys.includes(k as CriterionKey)
      );

      const allBands = (['taskResponse', 'coherence', 'lexicalResource', 'grammar'] as CriterionKey[])
        .filter((k) => allEvaluatedKeys.includes(k))
        .map((k) => active.criteria[k].band);

      const computedOverall = calculateOverallBand(allBands.length ? allBands : [active.overallBand]);

      // Merge inline comments without duplicating by ID
      const existingComments = existingReview?.inlineComments || [];
      const newComments = active.inlineComments.map((c) => ({
        ...c,
        authorId: c.authorId || state.currentUser!.id,
        authorName: c.authorName || state.currentUser!.name,
      }));
      const commentMap = new Map<string, InlineComment>();
      existingComments.forEach((c) => commentMap.set(c.id, c));
      newComments.forEach((c) => commentMap.set(c.id, c));

      const completedReview: Review = {
        ...active,
        id: existingReview ? existingReview.id : active.id,
        essayId: active.essayId,
        reviewerId: existingReview ? existingReview.reviewerId : state.currentUser.id,
        inlineComments: Array.from(commentMap.values()),
        criteria: {
          taskResponse: activeCriteria.includes('taskResponse')
            ? active.criteria.taskResponse
            : (existingReview?.criteria.taskResponse || active.criteria.taskResponse),
          coherence: activeCriteria.includes('coherence')
            ? active.criteria.coherence
            : (existingReview?.criteria.coherence || active.criteria.coherence),
          lexicalResource: activeCriteria.includes('lexicalResource')
            ? active.criteria.lexicalResource
            : (existingReview?.criteria.lexicalResource || active.criteria.lexicalResource),
          grammar: activeCriteria.includes('grammar')
            ? active.criteria.grammar
            : (existingReview?.criteria.grammar || active.criteria.grammar),
        },
        reviewedCriteria: allEvaluatedKeys,
        criteriaEvaluators: mergedEvaluators,
        contributors: mergedContributors,
        isPartial: !fullyAssessed,
        overallBand: computedOverall,
        generalVerdict: active.generalVerdict || existingReview?.generalVerdict || '',
        createdAt: existingReview ? existingReview.createdAt : new Date().toISOString(),
        isComplete: true,
      };

      const assignment = essay ? state.assignments.find((a) => a.id === essay.assignmentId) : null;
      const classroom = assignment ? state.classrooms.find((c) => c.id === assignment.classroomId) : null;
      const reviewerName = state.currentUser.name;

      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        type: 'essay_reviewed',
        title: !fullyAssessed ? 'Эссе частично оценено' : 'Эссе проверено!',
        body: `${reviewerName} ${!fullyAssessed ? `оценил(а) [${activeCriteria.join(', ')}]` : 'оценил(а) ваше эссе'}. Текущий балл: ${computedOverall.toFixed(1)}.`,
        essayId: completedReview.essayId,
        assignmentId: assignment?.id,
        recipientId: essay?.authorId || '',
        createdAt: new Date().toISOString(),
        read: false,
      };

      const teacherNotif: Notification = {
        id: `notif-${Date.now() + 1}`,
        type: 'review_submitted',
        title: 'Получена рецензия',
        body: `${reviewerName} проверил(а) работу ${isPartial ? '(модульная проверка)' : ''}. Балл: ${computedOverall.toFixed(1)}.`,
        assignmentId: assignment?.id,
        classroomId: classroom?.id,
        recipientId: classroom?.teacherId || '',
        createdAt: new Date().toISOString(),
        read: false,
      };

      const toast: ToastMessage = {
        id: `toast-${Date.now()}`,
        type: 'success',
        title: isPartial ? 'Модульная оценка сохранена!' : 'Рецензия отправлена!',
        message: isPartial
          ? `Оценены критерии: ${activeCriteria.join(', ')}. Другие студенты могут дополнить оценку.`
          : `Рецензия (Band ${computedOverall.toFixed(1)}) успешно сохранена.`,
      };

      const inlineBonus = active.inlineComments.length * 5;
      const criteriaBonus = activeCriteria.length * 25;
      const xpEarned = criteriaBonus + inlineBonus;
      const newXp = state.xp + xpEarned;
      const getRank = (xp: number) => {
        if (xp >= 1000) return 'master_examiner' as const;
        if (xp >= 500) return 'senior_peer' as const;
        if (xp >= 200) return 'rising_star' as const;
        return 'novice' as const;
      };

      const updatedReviews = existingReview
        ? state.reviews.map((r) => (r.id === existingReview.id ? completedReview : r))
        : [...state.reviews, completedReview];

      // Persist review and notifications to Supabase
      upsertReview(completedReview).then((realId) => {
        if (realId && realId !== completedReview.id) {
          useStore.setState((s) => ({
            reviews: s.reviews.map((r) => r.id === completedReview.id ? { ...r, id: realId } : r),
          }));
        }
      });
      insertNotification({ type: newNotif.type, title: newNotif.title, body: newNotif.body, essayId: newNotif.essayId, assignmentId: newNotif.assignmentId, recipientId: newNotif.recipientId });
      insertNotification({ type: teacherNotif.type, title: teacherNotif.title, body: teacherNotif.body, assignmentId: teacherNotif.assignmentId, classroomId: teacherNotif.classroomId, recipientId: teacherNotif.recipientId });

      return {
        reviews: updatedReviews,
        activeReview: null,
        essays: state.essays.map((e) =>
          e.id === completedReview.essayId
            ? { ...e, status: fullyAssessed ? ('reviewed' as const) : ('reviewing' as const) }
            : e
        ),
        notifications: [...state.notifications, newNotif, teacherNotif],
        toasts: [...state.toasts, toast],
        xp: newXp,
        reviewerRank: getRank(newXp),
        lastActivityDate: new Date().toISOString(),
      };
    }),

  createClassroom: (classroom) => {
    const tempId = `class-${Date.now()}`;
    const newClassroom: Classroom = {
      ...classroom,
      id: tempId,
      studentIds: [],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ classrooms: [...state.classrooms, newClassroom] }));
    // Persist to Supabase and swap temp id with real UUID
    insertClassroom(classroom).then((realId) => {
      if (realId && realId !== tempId) {
        useStore.setState((s) => ({
          classrooms: s.classrooms.map((c) =>
            c.id === tempId ? { ...c, id: realId } : c
          ),
        }));
      }
    });
  },

  joinClassroom: (rawCode) => {
    const state = get();
    const code = rawCode.trim().toUpperCase();
    const classroom = state.classrooms.find((c) => c.code.trim().toUpperCase() === code);
    if (!classroom || !state.currentUser) return { success: false, reason: 'not_found' };

    if (classroom.teacherId === state.currentUser.id) {
      return { success: false, reason: 'teacher_owner' };
    }
    if (classroom.studentIds.includes(state.currentUser.id)) {
      return { success: false, reason: 'already_joined' };
    }

    set({
      classrooms: state.classrooms.map((c) =>
        c.id === classroom.id
          ? { ...c, studentIds: [...c.studentIds, state.currentUser!.id] }
          : c
      ),
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          type: 'success',
          title: 'Вы присоединились к классу!',
          message: `Добро пожаловать в класс "${classroom.name}".`,
        },
      ],
    });
    // Persist to Supabase
    insertClassroomStudent(classroom.id, state.currentUser!.id);
    return { success: true };
  },

  createAssignment: (assignment) =>
    set((state) => {
      const sanitizedPrompt = assignment.prompt.slice(0, 3000);
      const tempId = `assign-${Date.now()}`;
      const newAssignment: Assignment = {
        ...assignment,
        prompt: sanitizedPrompt,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      const classroom = state.classrooms.find((c) => c.id === assignment.classroomId);
      const studentNotifs: Notification[] = (classroom?.studentIds || []).map((sid, i) => ({
        id: `notif-${Date.now()}-${i}`,
        type: 'new_assignment' as const,
        title: 'Новое задание!',
        body: `${state.currentUser?.name || 'Учитель'} опубликовал(а) "${assignment.title}"${classroom ? ` в классе ${classroom.name}` : ''}.`,
        classroomId: assignment.classroomId,
        assignmentId: tempId,
        recipientId: sid,
        createdAt: new Date().toISOString(),
        read: false,
      }));
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}`,
        type: 'info',
        title: 'Задание опубликовано!',
        message: `"${assignment.title}" отправлено в класс.`,
      };
      // Persist to Supabase
      insertAssignment({ ...assignment, prompt: sanitizedPrompt }).then((realId) => {
        if (realId) {
          useStore.setState((s) => ({
            assignments: s.assignments.map((a) => a.id === tempId ? { ...a, id: realId } : a),
          }));
          // Send notifications to DB
          studentNotifs.forEach((n) => insertNotification({ ...n, assignmentId: realId }));
        }
      });
      return {
        assignments: [...state.assignments, newAssignment],
        notifications: [...state.notifications, ...studentNotifs],
        toasts: [...state.toasts, newToast],
      };
    }),

  submitEssay: (essay) =>
    set((state) => {
      const sanitizedContent = essay.content.slice(0, 3000);
      const words = sanitizedContent.trim().split(/\s+/).filter(Boolean).length;
      const existingIdx = state.essays.findIndex(
        (e) => e.assignmentId === essay.assignmentId && e.authorId === essay.authorId
      );

      const submittedEssay: Essay = {
        ...essay,
        content: sanitizedContent,
        wordCount: words,
        id: existingIdx >= 0 ? state.essays[existingIdx].id : `essay-${Date.now()}`,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };

      const updatedEssays = existingIdx >= 0
        ? state.essays.map((e, idx) => (idx === existingIdx ? submittedEssay : e))
        : [...state.essays, submittedEssay];

      // Persist to Supabase
      upsertEssay(submittedEssay).then((realId) => {
        if (realId && realId !== submittedEssay.id) {
          useStore.setState((s) => ({
            essays: s.essays.map((e) => e.id === submittedEssay.id ? { ...e, id: realId } : e),
          }));
        }
      });

      const newToast: ToastMessage = {
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Эссе успешно отправлено!',
        message: `Объем: ${words} слов. Работа направлена на рецензирование одноклассникам.`,
      };
      return {
        essays: updatedEssays,
        toasts: [...state.toasts, newToast],
      };
    }),

  saveDraft: (essay) =>
    set((state) => {
      const sanitizedContent = essay.content.slice(0, 3000);
      const words = sanitizedContent.trim().split(/\s+/).filter(Boolean).length;
      const existingIdx = state.essays.findIndex(
        (e) => e.assignmentId === essay.assignmentId && e.authorId === essay.authorId
      );

      const draftEssay: Essay = {
        ...essay,
        content: sanitizedContent,
        wordCount: words,
        id: existingIdx >= 0 ? state.essays[existingIdx].id : `essay-${Date.now()}`,
        status: 'draft',
      };

      const updatedEssays = existingIdx >= 0
        ? state.essays.map((e, idx) => (idx === existingIdx ? draftEssay : e))
        : [...state.essays, draftEssay];

      // Persist to Supabase
      upsertEssay(draftEssay);

      return {
        essays: updatedEssays,
        toasts: [
          ...state.toasts,
          {
            id: `toast-draft-${Date.now()}`,
            type: 'info',
            title: 'Черновик сохранён',
            message: `Сохранено ${words} слов. Вы можете вернуться к редактированию позже.`,
            duration: 3000,
          },
        ],
      };
    }),

  // Notifications
  addNotification: (notif) =>
    set((state) => {
      const newNotif = {
        ...notif,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      // Persist to Supabase
      insertNotification(notif);
      return { notifications: [newNotif, ...state.notifications] };
    }),

  markNotificationRead: (id) => {
    markNotificationReadDb(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  simulateTeacherTopicNotification: () => {
    const state = get();
    const targetUserId = state.currentUser?.id || 'all';
    const topics = [
      {
        title: 'New Topic: AI in Higher Education',
        body: 'Dr. Sarah Mitchell published a new writing prompt & lexical resource pack: "Artificial Intelligence in Higher Education: Band 9 Model Arguments".',
        classroomId: 'class-1',
        assignmentId: 'assign-1',
      },
      {
        title: 'New Topic: Climate Action & Urban Mobility',
        body: 'Dr. Sarah Mitchell uploaded a new Discussion Essay topic: "Should cities ban private vehicles in urban centers? Essential vocabulary and sample outlines".',
        classroomId: 'class-1',
        assignmentId: 'assign-2',
      },
      {
        title: 'New Topic: Space Exploration vs Poverty',
        body: 'Dr. Sarah Mitchell uploaded a new IELTS Task 2 Topic: "Government funding on space exploration vs poverty alleviation".',
        classroomId: 'class-2',
        assignmentId: 'assign-3',
      },
    ];
    const picked = topics[Math.floor(Math.random() * topics.length)];
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'new_topic',
      title: picked.title,
      body: picked.body,
      classroomId: picked.classroomId,
      assignmentId: picked.assignmentId,
      recipientId: targetUserId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}`,
      type: 'info',
      title: 'Teacher Uploaded New Topic!',
      message: picked.body,
      duration: 6500,
    };
    set({
      notifications: [newNotif, ...state.notifications],
      toasts: [...state.toasts, newToast],
    });
  },

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  notifPanelOpen: false,
  setNotifPanelOpen: (open) => set({ notifPanelOpen: open }),

  // Gamification initial state
  xp: 150,
  streak: 7,
  lastActivityDate: new Date().toISOString(),
  badges: mockBadges,
  reviewerRank: 'novice',

  addXP: (amount, reason) =>
    set((state) => {
      const newXp = state.xp + amount;
      const getRank = (xp: number): ReviewerRank => {
        if (xp >= 1000) return 'master_examiner';
        if (xp >= 500) return 'senior_peer';
        if (xp >= 200) return 'rising_star';
        return 'novice';
      };
      const newRank = getRank(newXp);
      const oldRank = getRank(state.xp);
      const rankUp = newRank !== oldRank;
      const rankLabels: Record<ReviewerRank, string> = {
        novice: 'Novice Reviewer',
        rising_star: 'Rising Star',
        senior_peer: 'Senior Peer',
        master_examiner: 'Master Examiner',
      };
      const toasts = rankUp
        ? [...state.toasts, {
            id: `toast-rankup-${Date.now()}`,
            type: 'success' as const,
            title: `🎖️ Rank Up! You are now a ${rankLabels[newRank]}`,
            message: reason ? `Earned ${amount} XP for: ${reason}` : `Earned ${amount} XP`,
            duration: 7000,
          }]
        : state.toasts;
      return { xp: newXp, reviewerRank: newRank, toasts };
    }),

  awardBadge: (badge) =>
    set((state) => {
      const alreadyHas = state.badges.some((b) => b.name === badge.name);
      if (alreadyHas) return state;
      const newBadge: Badge = {
        ...badge,
        id: `badge-${Date.now()}`,
        earnedAt: new Date().toISOString(),
      };
      const badgeToast: ToastMessage = {
        id: `toast-badge-${Date.now()}`,
        type: 'success',
        title: `${badge.emoji} Badge Earned: ${badge.name}`,
        message: badge.description,
        duration: 6000,
      };
      return {
        badges: [...state.badges, newBadge],
        toasts: [...state.toasts, badgeToast],
      };
    }),

  checkAndUpdateStreak: () =>
    set((state) => {
      const today = new Date().toDateString();
      const last = state.lastActivityDate ? new Date(state.lastActivityDate).toDateString() : null;
      if (last === today) return state;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = last === yesterday ? state.streak + 1 : 1;
      return { streak: newStreak, lastActivityDate: new Date().toISOString() };
    }),

  updateReviewByTeacher: (reviewId, updates) =>
    set((state) => {
      const existing = state.reviews.find((r) => r.id === reviewId);
      if (!existing) return state;

      const teacher = state.currentUser?.role === 'teacher' ? state.currentUser : null;
      const teacherName = teacher?.name || 'Teacher';
      const teacherId = teacher?.id || 'teacher-1';

      const essay = state.essays.find((e) => e.id === existing.essayId);
      const assignment = essay ? state.assignments.find((a) => a.id === essay.assignmentId) : null;
      const studentAuthor = essay ? state.users.find((u) => u.id === essay.authorId) : null;
      const originalBand = existing.originalBand ?? existing.overallBand;

      const updatedReview: Review = {
        ...existing,
        criteria: {
          taskResponse: { ...existing.criteria.taskResponse, ...updates.criteria.taskResponse },
          coherence: { ...existing.criteria.coherence, ...updates.criteria.coherence },
          lexicalResource: { ...existing.criteria.lexicalResource, ...updates.criteria.lexicalResource },
          grammar: { ...existing.criteria.grammar, ...updates.criteria.grammar },
        },
        overallBand: updates.overallBand,
        generalVerdict: updates.generalVerdict.slice(0, 3000),
        editedByTeacher: true,
        teacherId,
        teacherName,
        teacherEditedAt: new Date().toISOString(),
        teacherFeedback: updates.teacherFeedback ? updates.teacherFeedback.slice(0, 3000) : undefined,
        originalBand,
      };

      // Notification for author
      const authorNotif: Notification = {
        id: `notif-teacher-grade-${Date.now()}`,
        type: 'grade_edited_by_teacher',
        title: 'Teacher Updated Your Grade',
        body: `${teacherName} adjusted your grade for "${assignment?.title || 'your essay'}" to Band ${updates.overallBand.toFixed(1)}${originalBand !== updates.overallBand ? ` (was Band ${originalBand.toFixed(1)})` : ''}.${updates.teacherFeedback ? ` Comment: "${updates.teacherFeedback}"` : ''}`,
        essayId: existing.essayId,
        assignmentId: assignment?.id,
        recipientId: essay?.authorId || '',
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Notification for student reviewer
      const reviewerNotif: Notification = {
        id: `notif-reviewer-update-${Date.now() + 1}`,
        type: 'grade_edited_by_teacher',
        title: 'Teacher Verified Your Peer Review',
        body: `${teacherName} reviewed your assessment for ${studentAuthor?.name || 'student'}. Final Band: ${updates.overallBand.toFixed(1)}.`,
        essayId: existing.essayId,
        assignmentId: assignment?.id,
        recipientId: existing.reviewerId,
        createdAt: new Date().toISOString(),
        read: false,
      };

      const toast: ToastMessage = {
        id: `toast-grade-updated-${Date.now()}`,
        type: 'success',
        title: 'Grade Updated & Saved!',
        message: `Band score updated to ${updates.overallBand.toFixed(1)} for ${studentAuthor?.name || 'student'}. Saved in database.`,
        duration: 5000,
      };

      return {
        reviews: state.reviews.map((r) => (r.id === reviewId ? updatedReview : r)),
        essays: state.essays.map((e) => (e.id === existing.essayId ? { ...e, status: 'reviewed' as const } : e)),
        notifications: [authorNotif, reviewerNotif, ...state.notifications],
        toasts: [...state.toasts, toast],
      };
    }),

  createTeacherReview: (essayId, reviewData) =>
    set((state) => {
      const teacher = state.currentUser?.role === 'teacher' ? state.currentUser : null;
      const teacherName = teacher?.name || 'Teacher';
      const teacherId = teacher?.id || 'teacher-1';

      const essay = state.essays.find((e) => e.id === essayId);
      const assignment = essay ? state.assignments.find((a) => a.id === essay.assignmentId) : null;
      const studentAuthor = essay ? state.users.find((u) => u.id === essay.authorId) : null;

      const newReview: Review = {
        id: `review-teacher-${Date.now()}`,
        essayId,
        reviewerId: teacherId,
        inlineComments: [],
        criteria: reviewData.criteria,
        overallBand: reviewData.overallBand,
        generalVerdict: reviewData.generalVerdict.slice(0, 3000),
        createdAt: new Date().toISOString(),
        isComplete: true,
        editedByTeacher: true,
        teacherId,
        teacherName,
        teacherEditedAt: new Date().toISOString(),
        teacherFeedback: reviewData.teacherFeedback ? reviewData.teacherFeedback.slice(0, 3000) : undefined,
        originalBand: reviewData.overallBand,
      };

      const authorNotif: Notification = {
        id: `notif-teacher-grade-${Date.now()}`,
        type: 'grade_edited_by_teacher',
        title: 'Teacher Graded Your Essay',
        body: `${teacherName} graded your essay for "${assignment?.title || 'Assignment'}" — Band ${reviewData.overallBand.toFixed(1)}.`,
        essayId,
        assignmentId: assignment?.id,
        recipientId: essay?.authorId || '',
        createdAt: new Date().toISOString(),
        read: false,
      };

      const toast: ToastMessage = {
        id: `toast-teacher-grade-${Date.now()}`,
        type: 'success',
        title: 'Teacher Grade Published!',
        message: `Band ${reviewData.overallBand.toFixed(1)} assigned to ${studentAuthor?.name || 'student'}. Saved in database.`,
        duration: 5000,
      };

      return {
        reviews: [...state.reviews, newReview],
        essays: state.essays.map((e) => (e.id === essayId ? { ...e, status: 'reviewed' as const } : e)),
        notifications: [authorNotif, ...state.notifications],
        toasts: [...state.toasts, toast],
      };
    }),

  resetDatabase: () => {
    try {
      localStorage.removeItem('ielts_peer_review_db_v1');
    } catch (e) {
      console.error(e);
    }
    set({
      users: mockUsers,
      classrooms: mockClassrooms,
      assignments: mockAssignments,
      essays: mockEssays,
      reviews: mockReviews,
      notifications: mockNotifications,
      badges: mockBadges,
      xp: 150,
      streak: 7,
      reviewerRank: 'novice',
      toasts: [
        {
          id: `toast-db-reset-${Date.now()}`,
          type: 'info',
          title: 'Database Reset',
          message: 'Restored all initial demo data.',
          duration: 4000,
        },
      ],
    });
  },
    }),
    {
      name: 'ielts_peer_review_db_v1',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        theme: state.theme,
        currentUser: state.currentUser,
        users: state.users,
        classrooms: state.classrooms,
        assignments: state.assignments,
        essays: state.essays,
        reviews: state.reviews,
        notifications: state.notifications,
        badges: state.badges,
        xp: state.xp,
        streak: state.streak,
        reviewerRank: state.reviewerRank,
        lastActivityDate: state.lastActivityDate,
      }),
    }
  )
);

export function initReviewForEssay(essayId: string, reviewerId: string, existingReview?: Review | null): Review {
  if (existingReview) {
    return {
      ...existingReview,
      id: existingReview.id,
      essayId,
      reviewerId,
      isComplete: false,
    };
  }
  const r = defaultReview();
  r.essayId = essayId;
  r.reviewerId = reviewerId;
  return r;
}

