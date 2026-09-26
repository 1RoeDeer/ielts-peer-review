export type UserRole = 'teacher' | 'student';
export type ErrorCategory = 'grammar' | 'vocabulary' | 'punctuation' | 'style';
export type EssayType = 'opinion' | 'discussion' | 'problem-solution' | 'advantages-disadvantages' | 'task1';
export type SubmissionStatus = 'draft' | 'submitted' | 'reviewing' | 'reviewed';
export type NotificationType =
  | 'new_assignment'
  | 'new_topic'
  | 'essay_reviewed'
  | 'review_received'
  | 'deadline_reminder'
  | 'new_student_joined'
  | 'review_submitted'
  | 'grade_edited_by_teacher'
  | 'system_security';

export type ReviewerRank = 'novice' | 'rising_star' | 'senior_peer' | 'master_examiner';
export type AnnotationType = 'structure' | 'vocabulary' | 'grammar' | 'cohesion' | 'task';

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  earnedAt: string;
}

export interface AnnotationHighlight {
  startIndex: number;
  endIndex: number;
  text: string;
  note: string;
  type: AnnotationType;
}

export interface GrammarStructure {
  name: string;
  example: string;
  explanation: string;
}

export interface ModelEssay {
  id: string;
  assignmentId: string;
  content: string;
  bandScore: number;
  teacherNotes: string;
  annotations: AnnotationHighlight[];
  structures: GrammarStructure[];
  keyPhrases: string[];
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'security';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  classroomId?: string;
  assignmentId?: string;
  essayId?: string;
  recipientId: string;   // 'all' | userId
  createdAt: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  studentIds: string[];
  description: string;
  createdAt: string;
  color: string;
}

export interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  prompt: string;
  essayType: EssayType;
  deadline: string;
  minWords: number;
  requiredReviews: number;
  createdAt: string;
}

export interface Essay {
  id: string;
  assignmentId: string;
  authorId: string;
  content: string;
  wordCount: number;
  status: SubmissionStatus;
  submittedAt?: string;
  isExamMode?: boolean;
  timeSpentSeconds?: number;
  keystrokesCount?: number;
  pasteAttempts?: number;
  averageWpm?: number;
}

export type CriterionKey = 'taskResponse' | 'coherence' | 'lexicalResource' | 'grammar';

export interface CriterionEvaluator {
  userId: string;
  userName: string;
  userRole?: UserRole;
  evaluatedAt: string;
  band: number;
}

export interface ReviewContributor {
  userId: string;
  userName: string;
  role: UserRole;
  criteriaAssessed: CriterionKey[];
}

export interface InlineComment {
  id: string;
  startIndex: number;
  endIndex: number;
  highlightedText: string;
  category: ErrorCategory;
  comment: string;
  suggestion?: string;
  authorId?: string;
  authorName?: string;
}

export interface CriteriaScore {
  band: number;
  feedback: string;
  checklistState: Record<string, boolean>;
}

export interface Review {
  id: string;
  essayId: string;
  reviewerId: string;
  inlineComments: InlineComment[];
  criteria: {
    taskResponse: CriteriaScore;
    coherence: CriteriaScore;
    lexicalResource: CriteriaScore;
    grammar: CriteriaScore;
  };
  // Collaborative / Modular Review support
  reviewedCriteria?: CriterionKey[];
  criteriaEvaluators?: Partial<Record<CriterionKey, CriterionEvaluator>>;
  contributors?: ReviewContributor[];
  isPartial?: boolean;

  overallBand: number;
  generalVerdict: string;
  createdAt: string;
  isComplete: boolean;
  editedByTeacher?: boolean;
  teacherId?: string;
  teacherName?: string;
  teacherEditedAt?: string;
  teacherFeedback?: string;
  originalBand?: number;
}

export interface TeacherReviewUpdate {
  criteria: {
    taskResponse: CriteriaScore;
    coherence: CriteriaScore;
    lexicalResource: CriteriaScore;
    grammar: CriteriaScore;
  };
  overallBand: number;
  generalVerdict: string;
  teacherFeedback?: string;
}

export interface ReviewQueueItem {
  essayId: string;
  assignmentId: string;
  assignmentTitle: string;
  classroomName: string;
  submittedAt: string;
}

