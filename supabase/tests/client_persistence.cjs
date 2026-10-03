// Run from the repository root: node supabase/tests/client_persistence.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createRequire, Module } = require('node:module');

const root = join(__dirname, '..', '..');
const requireProject = createRequire(join(root, 'package.json'));
const ts = requireProject('typescript');
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};

const savedEssays = new Map();
const savedReviews = new Map();
const essayRequests = [];
let failNextEssay = false;
let failNextReview = false;
let failNextClassroom = false;
let failNextAssignment = false;
const db = {
  insertClassroom: async () => failNextClassroom ? (failNextClassroom = false, null) : '20000000-0000-0000-0000-000000000002',
  insertAssignment: async () => failNextAssignment ? (failNextAssignment = false, null) : '30000000-0000-0000-0000-000000000002',
  upsertEssay: async (essay) => {
    essayRequests.push(essay.id);
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (failNextEssay) { failNextEssay = false; return null; }
    const key = `${essay.assignmentId}:${essay.authorId}`;
    const id = savedEssays.get(key)?.id ?? '40000000-0000-0000-0000-000000000001';
    savedEssays.set(key, { ...essay, id });
    return id;
  },
  upsertReview: async (review) => {
    if (failNextReview) { failNextReview = false; return null; }
    const id = review.id.startsWith('review-') ? '50000000-0000-0000-0000-000000000002' : review.id;
    savedReviews.set(id, { ...review, id });
    return id;
  },
  insertNotification: async () => {},
};
const source = ts.transpileModule(readFileSync(join(root, 'src/store/useStore.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = new Module(join(root, 'src/store/useStore.ts'));
mod.require = (name) => name === '../lib/db' ? db
  : name === '../lib/supabase' ? { supabase: { auth: { signOut: async () => ({ error: null }) } } }
    : name === '../data/mockData' ? Object.fromEntries(
      ['mockUsers', 'mockClassrooms', 'mockAssignments', 'mockEssays', 'mockReviews', 'mockNotifications', 'mockBadges']
        .map((key) => [key, []]))
      : requireProject(name);
mod._compile(source, join(root, 'src/store/useStore.ts'));
const { useStore } = mod.exports;

(async () => {
  const student = { id: 'student-a', name: 'Student', role: 'student' };
  const teacher = { id: 'teacher-a', name: 'Teacher', role: 'teacher' };
  const classroom = { id: 'class-a', teacherId: teacher.id, studentIds: [student.id] };
  const assignment = { id: 'assignment-a', classroomId: classroom.id, title: 'Task' };
  useStore.setState({ currentUser: student, classrooms: [classroom], assignments: [assignment], essays: [], reviews: [] });
  const draft = { assignmentId: assignment.id, authorId: student.id, content: 'First', wordCount: 1, status: 'draft' };
  const first = useStore.getState().saveDraft(draft);
  const second = useStore.getState().saveDraft({ ...draft, content: 'Second' });
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(essayRequests.length, 2);
  assert.equal(essayRequests[1], '40000000-0000-0000-0000-000000000001');
  assert.equal(useStore.getState().essays[0].content, 'Second');
  assert.equal(await useStore.getState().submitEssay({ ...draft, content: 'Final', status: 'submitted' }), true);
  assert.equal(savedEssays.get('assignment-a:student-a').status, 'submitted');
  useStore.setState({ essays: [...savedEssays.values()] }); // auth reload from server
  assert.equal(useStore.getState().essays[0].content, 'Final');
  failNextEssay = true;
  assert.equal(await useStore.getState().saveDraft({ ...draft, content: 'Unsaved' }), false);
  assert.equal(useStore.getState().essays[0].content, 'Final');
  assert.equal(savedEssays.get('assignment-a:student-a').content, 'Final');

  const score = { band: 6, feedback: '', checklistState: {} };
  const criteria = { taskResponse: score, coherence: score, lexicalResource: score, grammar: score };
  const peerEssay = { id: '40000000-0000-0000-0000-000000000009', assignmentId: assignment.id,
    authorId: 'student-b', content: 'Peer work', status: 'submitted' };
  const activeReview = { id: 'review-new', essayId: peerEssay.id, reviewerId: student.id, criteria,
    overallBand: 6, generalVerdict: 'Useful feedback', createdAt: new Date().toISOString(),
    isComplete: false, inlineComments: [], reviewedCriteria: ['taskResponse', 'coherence', 'lexicalResource', 'grammar'] };
  useStore.setState({ essays: [useStore.getState().essays[0], peerEssay], activeReview,
    classrooms: [{ ...classroom, studentIds: [student.id, 'student-b'] }] });
  failNextReview = true;
  assert.equal(await useStore.getState().submitReview(), false);
  assert.equal(useStore.getState().activeReview.id, activeReview.id);
  assert.equal(useStore.getState().reviews.length, 0);
  assert.equal(await useStore.getState().submitReview(), true);
  assert.equal(useStore.getState().activeReview, null);
  assert.equal(useStore.getState().reviews[0].id, '50000000-0000-0000-0000-000000000002');

  const review = { id: '50000000-0000-0000-0000-000000000001', essayId: useStore.getState().essays[0].id,
    reviewerId: 'peer-a', criteria, overallBand: 6, generalVerdict: '', createdAt: new Date().toISOString(),
    isComplete: true, inlineComments: [] };
  useStore.setState({ currentUser: teacher, users: [student, teacher], reviews: [review] });
  failNextReview = true;
  assert.equal(await useStore.getState().updateReviewByTeacher(review.id, { criteria, overallBand: 7, generalVerdict: 'Better' }), false);
  assert.equal(useStore.getState().reviews[0].overallBand, 6);
  assert.equal(await useStore.getState().updateReviewByTeacher(review.id, { criteria, overallBand: 7, generalVerdict: 'Better' }), true);
  assert.equal(savedReviews.get(review.id).overallBand, 7);
  assert.equal(await useStore.getState().createTeacherReview(review.essayId, { criteria, overallBand: 8, generalVerdict: 'Teacher' }), true);
  assert(useStore.getState().reviews.some((item) => item.id === '50000000-0000-0000-0000-000000000002'));
  assert.equal(savedReviews.get('50000000-0000-0000-0000-000000000002').overallBand, 8);
  const newClassroom = { teacherId: teacher.id, name: 'Pilot B', description: '', code: 'IELTS-TEST', color: 'neutral' };
  failNextClassroom = true;
  assert.equal(await useStore.getState().createClassroom(newClassroom), false);
  assert.equal(useStore.getState().classrooms.length, 1);
  assert.equal(await useStore.getState().createClassroom(newClassroom), true);
  const createdClassroom = useStore.getState().classrooms.at(-1);
  assert.equal(createdClassroom.id, '20000000-0000-0000-0000-000000000002');
  const newAssignment = { classroomId: createdClassroom.id, title: 'Pilot assignment', prompt: 'Write',
    essayType: 'opinion', deadline: new Date().toISOString(), minWords: 250, requiredReviews: 2 };
  failNextAssignment = true;
  assert.equal(await useStore.getState().createAssignment(newAssignment), false);
  assert.equal(useStore.getState().assignments.length, 1);
  assert.equal(await useStore.getState().createAssignment(newAssignment), true);
  assert.equal(useStore.getState().assignments.at(-1).id, '30000000-0000-0000-0000-000000000002');
  console.log('Client persistence PASS: draft/review/grade/class/assignment success, UUID and failure handling');
})().catch((error) => { console.error(error); process.exitCode = 1; });
