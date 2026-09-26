import { supabase } from './supabase';
import type {
  User, Classroom, Assignment, Essay, Review, Notification,
} from '../types';

// ─── PROFILES ─────────────────────────────────────────────────

export async function fetchAllProfiles(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) { console.error('fetchAllProfiles:', error); return []; }
  return (data ?? []).map(dbToUser);
}

export async function upsertProfile(user: User): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
  });
  if (error) console.error('upsertProfile:', error);
}

function dbToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? '',
    avatar: (row.avatar as string) ?? '',
    role: row.role as 'teacher' | 'student',
  };
}

// ─── CLASSROOMS ───────────────────────────────────────────────

export async function fetchAllClassrooms(): Promise<Classroom[]> {
  const { data: classRows, error: cErr } = await supabase
    .from('classrooms')
    .select('*');
  if (cErr) { console.error('fetchAllClassrooms:', cErr); return []; }

  const { data: memberRows, error: mErr } = await supabase
    .from('classroom_students')
    .select('classroom_id, student_id');
  if (mErr) { console.error('fetchClassroomStudents:', mErr); return []; }

  return (classRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    code: c.code as string,
    teacherId: c.teacher_id as string,
    studentIds: (memberRows ?? [])
      .filter((m) => m.classroom_id === c.id)
      .map((m) => m.student_id as string),
    description: (c.description as string) ?? '',
    color: (c.color as string) ?? 'violet',
    createdAt: c.created_at as string,
  }));
}

export async function insertClassroom(
  c: Omit<Classroom, 'id' | 'createdAt' | 'studentIds'>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('classrooms')
    .insert({
      name: c.name,
      code: c.code,
      teacher_id: c.teacherId,
      description: c.description,
      color: c.color,
    })
    .select('id')
    .single();
  if (error) { console.error('insertClassroom:', error); return null; }
  return data?.id ?? null;
}

export async function insertClassroomStudent(
  classroomId: string,
  studentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('classroom_students')
    .insert({ classroom_id: classroomId, student_id: studentId });
  if (error) { console.error('insertClassroomStudent:', error); return false; }
  return true;
}

// ─── ASSIGNMENTS ──────────────────────────────────────────────

export async function fetchAllAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase.from('assignments').select('*');
  if (error) { console.error('fetchAllAssignments:', error); return []; }
  return (data ?? []).map((a) => ({
    id: a.id as string,
    classroomId: a.classroom_id as string,
    title: a.title as string,
    prompt: a.prompt as string,
    essayType: a.essay_type as Assignment['essayType'],
    deadline: a.deadline as string,
    minWords: (a.min_words as number) ?? 250,
    requiredReviews: (a.required_reviews as number) ?? 2,
    createdAt: a.created_at as string,
  }));
}

export async function insertAssignment(
  a: Omit<Assignment, 'id' | 'createdAt'>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      classroom_id: a.classroomId,
      title: a.title,
      prompt: a.prompt,
      essay_type: a.essayType,
      deadline: a.deadline,
      min_words: a.minWords,
      required_reviews: a.requiredReviews,
    })
    .select('id')
    .single();
  if (error) { console.error('insertAssignment:', error); return null; }
  return data?.id ?? null;
}

// ─── ESSAYS ───────────────────────────────────────────────────

export async function fetchAllEssays(): Promise<Essay[]> {
  const { data, error } = await supabase.from('essays').select('*');
  if (error) { console.error('fetchAllEssays:', error); return []; }
  return (data ?? []).map((e) => ({
    id: e.id as string,
    assignmentId: e.assignment_id as string,
    authorId: e.author_id as string,
    content: (e.content as string) ?? '',
    wordCount: (e.word_count as number) ?? 0,
    status: (e.status as Essay['status']) ?? 'draft',
    submittedAt: (e.submitted_at as string) ?? undefined,
    isExamMode: (e.is_exam_mode as boolean) ?? false,
    timeSpentSeconds: (e.time_spent_seconds as number) ?? undefined,
  }));
}

export async function upsertEssay(essay: Essay): Promise<string | null> {
  const row = {
    assignment_id: essay.assignmentId,
    author_id: essay.authorId,
    content: essay.content,
    word_count: essay.wordCount,
    status: essay.status,
    submitted_at: essay.submittedAt ?? null,
    is_exam_mode: essay.isExamMode ?? false,
    time_spent_seconds: essay.timeSpentSeconds ?? null,
  };

  // Try update first if id looks like a real UUID
  const isRealId = essay.id && !essay.id.startsWith('essay-');
  if (isRealId) {
    const { error } = await supabase
      .from('essays')
      .update(row)
      .eq('id', essay.id);
    if (!error) return essay.id;
  }

  // Insert new
  const { data, error } = await supabase
    .from('essays')
    .insert(row)
    .select('id')
    .single();
  if (error) { console.error('upsertEssay:', error); return null; }
  return data?.id ?? null;
}

// ─── REVIEWS ──────────────────────────────────────────────────

export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase.from('reviews').select('*');
  if (error) { console.error('fetchAllReviews:', error); return []; }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    essayId: r.essay_id as string,
    reviewerId: r.reviewer_id as string,
    inlineComments: (r.inline_comments as Review['inlineComments']) ?? [],
    criteria: (r.criteria as Review['criteria']),
    reviewedCriteria: (r.reviewed_criteria as Review['reviewedCriteria']) ?? [],
    criteriaEvaluators: (r.criteria_evaluators as Review['criteriaEvaluators']) ?? {},
    contributors: (r.contributors as Review['contributors']) ?? [],
    overallBand: (r.overall_band as number) ?? 5.0,
    generalVerdict: (r.general_verdict as string) ?? '',
    createdAt: r.created_at as string,
    isComplete: (r.is_complete as boolean) ?? false,
    isPartial: (r.is_partial as boolean) ?? false,
    editedByTeacher: (r.edited_by_teacher as boolean) ?? false,
    teacherId: (r.teacher_id as string) ?? undefined,
    teacherName: (r.teacher_name as string) ?? undefined,
    teacherEditedAt: (r.teacher_edited_at as string) ?? undefined,
    teacherFeedback: (r.teacher_feedback as string) ?? undefined,
    originalBand: (r.original_band as number) ?? undefined,
  }));
}

export async function upsertReview(review: Review): Promise<string | null> {
  const row = {
    essay_id: review.essayId,
    reviewer_id: review.reviewerId,
    inline_comments: review.inlineComments,
    criteria: review.criteria,
    reviewed_criteria: review.reviewedCriteria ?? [],
    criteria_evaluators: review.criteriaEvaluators ?? {},
    contributors: review.contributors ?? [],
    overall_band: review.overallBand,
    general_verdict: review.generalVerdict,
    is_complete: review.isComplete,
    is_partial: review.isPartial ?? false,
    edited_by_teacher: review.editedByTeacher ?? false,
    teacher_id: review.teacherId ?? null,
    teacher_name: review.teacherName ?? null,
    teacher_edited_at: review.teacherEditedAt ?? null,
    teacher_feedback: review.teacherFeedback ?? null,
    original_band: review.originalBand ?? null,
  };

  const isRealId = review.id && !review.id.startsWith('review-');
  if (isRealId) {
    const { error } = await supabase
      .from('reviews')
      .update(row)
      .eq('id', review.id);
    if (!error) return review.id;
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert(row)
    .select('id')
    .single();
  if (error) { console.error('upsertReview:', error); return null; }
  return data?.id ?? null;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────

export async function fetchNotificationsForUser(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`recipient_id.eq.${userId},recipient_id.eq.all`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('fetchNotifications:', error); return []; }
  return (data ?? []).map((n) => ({
    id: n.id as string,
    type: n.type as Notification['type'],
    title: n.title as string,
    body: n.body as string,
    classroomId: (n.classroom_id as string) ?? undefined,
    assignmentId: (n.assignment_id as string) ?? undefined,
    essayId: (n.essay_id as string) ?? undefined,
    recipientId: n.recipient_id as string,
    createdAt: n.created_at as string,
    read: (n.read as boolean) ?? false,
  }));
}

export async function insertNotification(
  notif: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    type: notif.type,
    title: notif.title,
    body: notif.body,
    classroom_id: notif.classroomId ?? null,
    assignment_id: notif.assignmentId ?? null,
    essay_id: notif.essayId ?? null,
    recipient_id: notif.recipientId,
    read: false,
  });
  if (error) console.error('insertNotification:', error);
}

export async function markNotificationReadDb(notifId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', notifId);
}

export async function markAllNotificationsReadDb(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .or(`recipient_id.eq.${userId},recipient_id.eq.all`);
}
