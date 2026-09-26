import type { User, Classroom, Assignment, Essay, Review, InlineComment, Notification } from '../types';

export const mockUsers: User[] = [
  {
    id: 'teacher-1',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@ieltsacademy.com',
    avatar: 'SM',
    role: 'teacher',
  },
  {
    id: 'teacher-2',
    name: 'Prof. James Wong',
    email: 'james.wong@ieltsacademy.com',
    avatar: 'JW',
    role: 'teacher',
  },
  {
    id: 'student-1',
    name: 'Aisha Karimova',
    email: 'aisha.k@student.com',
    avatar: 'AK',
    role: 'student',
  },
  {
    id: 'student-2',
    name: 'Marco Rossi',
    email: 'marco.r@student.com',
    avatar: 'MR',
    role: 'student',
  },
  {
    id: 'student-3',
    name: 'Yuki Tanaka',
    email: 'yuki.t@student.com',
    avatar: 'YT',
    role: 'student',
  },
  {
    id: 'student-4',
    name: 'Carlos Mendez',
    email: 'carlos.m@student.com',
    avatar: 'CM',
    role: 'student',
  },
  {
    id: 'student-5',
    name: 'Fatima Al-Hassan',
    email: 'fatima.h@student.com',
    avatar: 'FH',
    role: 'student',
  },
  {
    id: 'student-6',
    name: 'Priya Sharma',
    email: 'priya.s@student.com',
    avatar: 'PS',
    role: 'student',
  },
];

export const mockClassrooms: Classroom[] = [
  {
    id: 'class-1',
    name: 'IELTS Academic Writing — Batch A',
    code: 'IELTS-A7X2',
    teacherId: 'teacher-1',
    studentIds: ['student-1', 'student-2', 'student-3', 'student-4'],
    description: 'Intensive preparation for IELTS Academic Writing Tasks 1 & 2. Focus on band 7+ strategies.',
    createdAt: '2026-08-15T09:00:00Z',
    color: 'violet',
  },
  {
    id: 'class-2',
    name: 'IELTS General Training — Batch B',
    code: 'IELTS-G9K1',
    teacherId: 'teacher-1',
    studentIds: ['student-5', 'student-6'],
    description: 'General Training Writing module with emphasis on formal letters and opinion essays.',
    createdAt: '2026-08-20T09:00:00Z',
    color: 'indigo',
  },
  {
    id: 'class-3',
    name: 'Advanced IELTS — Prof. Wong',
    code: 'IELTS-W4P8',
    teacherId: 'teacher-2',
    studentIds: ['student-2', 'student-5'],
    description: 'Advanced cohort targeting band 8.0+. Deep analysis of grammatical range and lexical sophistication.',
    createdAt: '2026-09-01T09:00:00Z',
    color: 'teal',
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    classroomId: 'class-1',
    title: 'Opinion Essay: Technology & Education',
    prompt: `Some people believe that technology has made education better, while others feel it has had a negative impact on the quality of learning.\n\nTo what extent do you agree or disagree with this statement?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.`,
    essayType: 'opinion',
    deadline: '2026-09-25T23:59:00Z',
    minWords: 250,
    requiredReviews: 2,
    createdAt: '2026-09-10T09:00:00Z',
  },
  {
    id: 'assign-2',
    classroomId: 'class-1',
    title: 'Problem-Solution: Urban Traffic',
    prompt: `In many cities around the world, traffic congestion has become a major problem affecting the quality of life for residents.\n\nWhat are the main causes of this problem? What solutions can you suggest?\n\nWrite at least 250 words.`,
    essayType: 'problem-solution',
    deadline: '2026-10-05T23:59:00Z',
    minWords: 250,
    requiredReviews: 2,
    createdAt: '2026-09-12T09:00:00Z',
  },
  {
    id: 'assign-3',
    classroomId: 'class-1',
    title: 'Task 1: Bar Chart Analysis',
    prompt: `The bar chart below shows the number of visitors to three different museums in London between 2019 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.`,
    essayType: 'task1',
    deadline: '2026-09-28T23:59:00Z',
    minWords: 150,
    requiredReviews: 1,
    createdAt: '2026-09-15T09:00:00Z',
  },
];

export const essayContent1 = `In the modern era, technology has fundamentally transformed many aspects of our daily lives, and education is no exception. While some critics argue that digital tools have diminished the quality of traditional learning, I firmly believe that technology has, on the whole, greatly enhanced the educational experience for students worldwide.

To begin with, technology has dramatically expanded access to knowledge. Previously, learners in remote areas had limited access to quality educational resources. Today, however, platforms such as Khan Academy, Coursera, and YouTube provide world-class instruction to anyone with an internet connection. A student in rural Kazakhstan, for instance, can now attend virtual lectures delivered by professors from Harvard or Oxford, a privilege that was simply inconceivable two decades ago.

Furthermore, interactive digital tools cater to diverse learning styles far more effectively than traditional textbooks. Adaptive learning software, such as Duolingo for language acquisition or Photomath for mathematics, analyses individual student performance and adjusts the difficulty of exercises accordingly. This personalised approach ensures that each student progresses at their optimal pace, reducing frustration and improving retention of information.

Admittedly, the proliferation of smartphones and social media has introduced significant distractions into the classroom environment. Many students find it increasingly difficult to concentrate on their studies when notifications constantly interrupt their focus. Moreover, excessive screen time has raised legitimate concerns about the physical and mental wellbeing of young learners.

Nevertheless, these drawbacks are manageable with appropriate policies and digital literacy education. Schools can implement screen-time restrictions and teach students how to use technology responsibly and productively. When wielded correctly, technology does not undermine learning — it amplifies it.

In conclusion, while the misuse of technology poses certain risks to educational quality, its overall contribution to learning is overwhelmingly positive. I contend that the key lies not in abandoning technology but in harnessing its power thoughtfully and strategically.`;

export const essayContent2 = `Traffic congestion represents one of the most pervasive and damaging issues confronting contemporary urban environments. As cities continue to expand and car ownership rates rise dramatically, gridlock has become a daily reality for millions of commuters, resulting in lost productivity, increased pollution, and deteriorating mental health. This essay examines the primary causes of urban traffic congestion and proposes several practical solutions to address this multifaceted problem.

The principal cause of traffic congestion is the overwhelming reliance on private vehicles. In many developing nations, inadequate public transportation infrastructure forces residents to depend entirely on personal cars for their daily commute. When millions of individuals simultaneously travel to work during peak hours, road networks inevitably reach their capacity. Compounding this issue is the phenomenon of urban sprawl, whereby cities expand outwards without proportional investment in transport links, effectively obligating people to travel greater distances.

Secondary causes include poor urban planning and inefficient traffic management systems. Many cities were designed decades ago with far smaller populations in mind, resulting in road networks that are wholly insufficient for contemporary traffic volumes. Additionally, the absence of smart traffic signals and real-time monitoring means that vehicles often idle unnecessarily at intersections, exacerbating congestion.

To tackle these challenges, governments should prioritise investment in public transportation. Expanding metro systems, introducing dedicated bus rapid transit lanes, and subsidising commuter rail services would provide viable alternatives to private car usage. Singapore and Amsterdam serve as compelling exemplars, having successfully reduced congestion through robust public transit networks combined with congestion charging schemes.

Urban planners should also promote mixed-use zoning, ensuring that residential, commercial, and recreational spaces are integrated within walking or cycling distance. Such an approach, exemplified in cities like Copenhagen, dramatically reduces the need for long commutes.

In conclusion, while urban traffic congestion stems from complex structural causes, targeted investment in public transport and intelligent urban design can substantially alleviate this pressing problem.`;

export const essayContent3 = `The bar chart illustrates the number of visitors to three prominent London museums — the British Museum, the Natural History Museum, and the Victoria and Albert Museum — across a five-year period from 2019 to 2023.

Overall, the British Museum attracted the highest number of visitors throughout the entire period, though all three institutions experienced a dramatic decline in 2020 before recovering in subsequent years.

In 2019, the British Museum welcomed approximately 6.2 million visitors, significantly outpacing the Natural History Museum at 4.4 million and the Victoria and Albert Museum at 3.8 million. However, as a consequence of the global pandemic, visitor numbers plummeted across all three venues in 2020, with the British Museum recording its lowest figure of merely 1.7 million, followed by the Natural History Museum at 1.0 million and the Victoria and Albert at 0.9 million.

Recovery began in 2021, with moderate increases observed at all three museums. The most notable rebound occurred between 2021 and 2022, when the British Museum's attendance surged from 3.5 to 5.8 million, nearly approaching pre-pandemic levels. By 2023, the Natural History Museum had surpassed its 2019 figures, reaching 4.7 million visitors, while the Victoria and Albert also achieved a new peak of 4.1 million.

In summary, despite the severe disruption caused by the pandemic, London's major museums demonstrated remarkable resilience, with visitor numbers largely recovering to or exceeding pre-pandemic levels by 2023.`;

export const mockEssays: Essay[] = [
  {
    id: 'essay-1',
    assignmentId: 'assign-1',
    authorId: 'student-1',
    content: essayContent1,
    wordCount: 287,
    status: 'submitted',
    submittedAt: '2026-09-18T14:30:00Z',
  },
  {
    id: 'essay-2',
    assignmentId: 'assign-2',
    authorId: 'student-2',
    content: essayContent2,
    wordCount: 312,
    status: 'reviewing',
    submittedAt: '2026-09-17T11:00:00Z',
  },
  {
    id: 'essay-3',
    assignmentId: 'assign-3',
    authorId: 'student-3',
    content: essayContent3,
    wordCount: 198,
    status: 'reviewed',
    submittedAt: '2026-09-16T09:45:00Z',
  },
  {
    id: 'essay-4',
    assignmentId: 'assign-1',
    authorId: 'student-4',
    content: essayContent2,
    wordCount: 312,
    status: 'submitted',
    submittedAt: '2026-09-18T10:00:00Z',
  },
];

export const sampleInlineComments: InlineComment[] = [
  {
    id: 'ic-1',
    startIndex: 0,
    endIndex: 43,
    highlightedText: 'In the modern era, technology has fundamentally',
    category: 'style',
    comment: 'Consider varying this opening — "In the modern era" is overused in IELTS essays.',
    suggestion: 'Over the past few decades, technological advancement has fundamentally',
  },
  {
    id: 'ic-2',
    startIndex: 320,
    endIndex: 367,
    highlightedText: 'dramatically expanded access to knowledge',
    category: 'vocabulary',
    comment: '"Dramatically expanded" is a strong collocation — well used here.',
    suggestion: '',
  },
  {
    id: 'ic-3',
    startIndex: 820,
    endIndex: 857,
    highlightedText: 'world-class instruction to anyone with',
    category: 'grammar',
    comment: 'Good sentence structure, but consider if "world-class" fits academic register.',
    suggestion: 'high-quality instruction accessible to anyone with',
  },
];

export const mockReviews: Review[] = [
  {
    id: 'review-1',
    essayId: 'essay-3',
    reviewerId: 'student-2',
    inlineComments: sampleInlineComments,
    criteria: {
      taskResponse: {
        band: 7.0,
        feedback: 'The essay addresses the task well with clear data comparison. The overview paragraph effectively identifies the key trend. However, some specific figures could be integrated more precisely.',
        checklistState: {
          allPartsAddressed: true,
          clearPosition: true,
          examplesProvided: true,
          adequateLength: true,
        },
      },
      coherence: {
        band: 6.5,
        feedback: 'Paragraphing is logical, but transitions between data points occasionally feel abrupt. The use of discourse markers could be more varied.',
        checklistState: {
          logicalParagraphs: true,
          correctLinkingWords: false,
          clearProgression: true,
        },
      },
      lexicalResource: {
        band: 7.0,
        feedback: 'Good range of vocabulary with academic collocations. Terms like "pervasive" and "multifaceted" demonstrate strong lexical control. Watch for minor repetition of "visitors".',
        checklistState: {
          academicVocabulary: true,
          noFrequentRepetition: false,
          appropriateCollocations: true,
        },
      },
      grammar: {
        band: 6.5,
        feedback: 'Generally accurate with a mix of sentence structures. A few instances of comma splices detected. The complex sentences are largely controlled.',
        checklistState: {
          complexSentences: true,
          minimalPunctuationErrors: false,
        },
      },
    },
    overallBand: 6.5,
    generalVerdict: 'A competent Task 1 response demonstrating solid data interpretation skills. The main areas for improvement are cohesion devices and grammatical accuracy, particularly punctuation. With focused practice on these elements, a band 7 is very achievable.',
    createdAt: '2026-09-17T15:00:00Z',
    isComplete: true,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-topic-1',
    type: 'new_topic',
    title: 'Teacher Uploaded New Topic',
    body: 'Dr. Sarah Mitchell published a new writing topic: “Technology & Artificial Intelligence in Modern Education: Task 2 Model Answers & Collocations” in IELTS Academic Writing — Batch A.',
    classroomId: 'class-1',
    assignmentId: 'assign-1',
    recipientId: 'all',
    createdAt: '2026-09-18T16:20:00Z',
    read: false,
  },
  {
    id: 'notif-1',
    type: 'new_assignment',
    title: 'New Assignment Published',
    body: 'Dr. Sarah Mitchell published “Opinion Essay: Technology & Education” in IELTS Academic Writing — Batch A.',
    classroomId: 'class-1',
    assignmentId: 'assign-1',
    recipientId: 'student-1',
    createdAt: '2026-09-18T10:05:00Z',
    read: false,
  },
  {
    id: 'notif-topic-2',
    type: 'new_topic',
    title: 'Teacher Shared Essay Topic Guide',
    body: 'Dr. Sarah Mitchell posted a new discussion prompt: “Should governments subsidize public transit to combat city congestion?”. Check the prompt before writing.',
    classroomId: 'class-1',
    assignmentId: 'assign-2',
    recipientId: 'all',
    createdAt: '2026-09-17T19:40:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'new_assignment',
    title: 'New Assignment Published',
    body: 'Dr. Sarah Mitchell published “Problem-Solution: Urban Traffic” in IELTS Academic Writing — Batch A.',
    classroomId: 'class-1',
    assignmentId: 'assign-2',
    recipientId: 'student-1',
    createdAt: '2026-09-17T09:05:00Z',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'essay_reviewed',
    title: 'Your Essay Has Been Reviewed',
    body: 'Your Task 1 essay for “Bar Chart Analysis” received a review — Band 6.5. Open to see detailed feedback.',
    essayId: 'essay-3',
    assignmentId: 'assign-3',
    recipientId: 'student-3',
    createdAt: '2026-09-17T15:10:00Z',
    read: false,
  },
  {
    id: 'notif-4',
    type: 'deadline_reminder',
    title: 'Deadline Approaching',
    body: '“Opinion Essay: Technology & Education” is due in 7 days. Make sure to submit before the deadline.',
    assignmentId: 'assign-1',
    classroomId: 'class-1',
    recipientId: 'student-2',
    createdAt: '2026-09-18T08:00:00Z',
    read: true,
  },
  {
    id: 'notif-5',
    type: 'new_student_joined',
    title: 'New Student Joined',
    body: 'Carlos Mendez joined your classroom “IELTS Academic Writing — Batch A”.',
    classroomId: 'class-1',
    recipientId: 'teacher-1',
    createdAt: '2026-09-16T11:30:00Z',
    read: false,
  },
  {
    id: 'notif-6',
    type: 'review_submitted',
    title: 'Peer Review Submitted',
    body: 'A student submitted a peer review for essay in “Task 1: Bar Chart Analysis”.',
    assignmentId: 'assign-3',
    classroomId: 'class-1',
    recipientId: 'teacher-1',
    createdAt: '2026-09-17T15:05:00Z',
    read: true,
  },
  {
    id: 'notif-7',
    type: 'new_assignment',
    title: 'New Assignment Published',
    body: 'Dr. Sarah Mitchell published “Task 1: Bar Chart Analysis” in IELTS Academic Writing — Batch A.',
    classroomId: 'class-1',
    assignmentId: 'assign-3',
    recipientId: 'student-4',
    createdAt: '2026-09-15T09:10:00Z',
    read: false,
  },
];

import type { ModelEssay, Badge } from '../types';

export const mockModelEssays: ModelEssay[] = [
  {
    id: 'model-1',
    assignmentId: 'assign-1',
    bandScore: 9.0,
    teacherNotes: 'This essay demonstrates mastery across all four IELTS criteria. Notice the sophisticated use of advanced grammatical structures (inversion, cleft sentences, mixed conditionals), a rich academic lexical range with no repetition, and a perfectly organised argument with seamless cohesive devices. The position is nuanced — neither extreme agreement nor disagreement — which reflects real-world critical thinking.',
    content: `Rarely has any single development reshaped human civilisation as profoundly as the digital revolution, and education is no exception. While a vocal minority contend that technology has eroded the quality of learning, I would argue, on balance, that it has been a transformative force for good — provided that educators and institutions embrace it with critical discernment.

It is technology that has democratised knowledge on an unprecedented scale. Prior to the internet age, access to quality educational resources was largely determined by geography and socioeconomic status. A student growing up in a rural community in Central Asia had little prospect of accessing the scholarly materials readily available to counterparts at elite institutions. What technology has achieved — through open-access platforms such as Coursera, edX, and Khan Academy — is the dismantling of these structural barriers. Not only does this broaden participation in higher learning, but it also elevates global standards by exposing students to world-class pedagogy regardless of their circumstances.

Furthermore, advances in adaptive learning technology have revolutionised the pedagogical process itself. Intelligent tutoring systems, driven by machine-learning algorithms, now analyse individual learning patterns and dynamically adjust the complexity and pacing of instruction. This degree of personalisation, which no single teacher could feasibly deliver to an entire classroom, has been shown to significantly accelerate mastery — particularly in subjects such as mathematics and language acquisition where iterative practice is paramount.

Admittedly, the integration of technology is not without its challenges. The omnipresence of smartphones has introduced a formidable distraction into the learning environment, and there is compelling evidence suggesting that excessive screen exposure is correlated with diminished attention spans among younger learners. Were it not for these genuine risks, the case for technology in education would be entirely uncontested.

Nevertheless, these concerns do not invalidate the technology itself, but rather point to the necessity of informed, purposeful pedagogical frameworks. Schools that have implemented structured digital literacy programmes and clear policies governing device use have consistently reported positive outcomes. In conclusion, technology's contribution to education is overwhelmingly positive; it is human wisdom in its application that determines whether its potential is fully realised.`,
    annotations: [
      {
        startIndex: 0,
        endIndex: 95,
        text: 'Rarely has any single development reshaped human civilisation as profoundly as the digital revolution',
        note: '🔥 Fronted Negative Adverbial → Inversion: "Rarely has any..." triggers subject-auxiliary inversion. This is a hallmark Band 8-9 grammatical structure that immediately signals sophistication to an examiner.',
        type: 'structure',
      },
      {
        startIndex: 310,
        endIndex: 380,
        text: 'It is technology that has democratised knowledge on an unprecedented scale',
        note: '✨ Cleft Sentence: "It is X that..." — used to foreground and emphasise the subject. A top-band device for controlling focus and showing grammatical range.',
        type: 'structure',
      },
      {
        startIndex: 700,
        endIndex: 775,
        text: 'Not only does this broaden participation in higher learning',
        note: '🔥 Fronted Correlative: "Not only does..." triggers inversion. Paired with "but it also..." — a classic Band 9 additive cohesive structure.',
        type: 'structure',
      },
      {
        startIndex: 1150,
        endIndex: 1230,
        text: 'which no single teacher could feasibly deliver to an entire classroom',
        note: '📚 Non-defining relative clause used to provide extra information without interrupting the main clause flow. Demonstrates complex sentence control.',
        type: 'grammar',
      },
      {
        startIndex: 1490,
        endIndex: 1570,
        text: 'Were it not for these genuine risks, the case for technology in education would be entirely uncontested',
        note: '🔥 Third Conditional Inversion: "Were it not for..." — the formal inverted conditional without "if". Extremely high-band grammatical structure. Demonstrates command of subjunctive mood.',
        type: 'structure',
      },
      {
        startIndex: 420,
        endIndex: 475,
        text: 'dismantling of these structural barriers',
        note: '📖 Academic Vocabulary: "dismantling" (metaphorical, collocates with "barriers"), "structural" — formal, precise lexical choice. Avoids basic words like "removing" or "breaking".',
        type: 'vocabulary',
      },
    ],
    structures: [
      { name: 'Fronted Inversion', example: 'Rarely has any single development...', explanation: 'Placing a negative adverb (Rarely, Never, Seldom, Not only) at the start of a sentence causes subject-auxiliary inversion, signalling Band 8-9 grammatical range.' },
      { name: 'Cleft Sentence', example: 'It is technology that has democratised...', explanation: '"It is X that/who..." — used to emphasise and foreground a particular element. Shows deliberate structural control.' },
      { name: 'Inverted Conditional', example: 'Were it not for these genuine risks...', explanation: 'Formal alternative to "If it were not for..." — the inversion of "were" is a classic Band 9 structure avoiding plain conditional forms.' },
      { name: 'Non-defining Relative Clause', example: '...personalisation, which no single teacher could feasibly deliver...', explanation: 'Adds supplementary detail without a new sentence; requires mastery of comma placement and pronoun reference.' },
    ],
    keyPhrases: [
      'on an unprecedented scale', 'dismantling structural barriers', 'world-class pedagogy',
      'adaptive learning technology', 'iterative practice is paramount', 'correlated with diminished attention spans',
      'purposeful pedagogical frameworks', 'digital literacy programmes', 'human wisdom in its application',
    ],
  },
  {
    id: 'model-2',
    assignmentId: 'assign-2',
    bandScore: 9.0,
    teacherNotes: 'An exemplary problem-solution essay. The structure is crystal clear: introduction with clear thesis, cause 1, cause 2, solution 1, solution 2, conclusion. Each paragraph opens with a strong topic sentence. The passive voice is used precisely where appropriate, and the essay deploys a variety of clause types. Pay attention to how real-world examples (Singapore, Amsterdam, Copenhagen) lend credibility without becoming the main point.',
    content: `Urban traffic congestion represents one of the defining infrastructure challenges of the twenty-first century, imposing enormous economic, environmental and psychological costs on city populations worldwide. This essay argues that while congestion stems primarily from over-reliance on private vehicles and inadequate urban planning, targeted investment in public transit and smarter land-use policy can substantially reverse this trend.

The principal driver of gridlock in most cities is the dominant position of private car ownership in daily commuting. In many rapidly urbanising nations — particularly across Southeast Asia and Latin America — the expansion of road networks has consistently failed to keep pace with soaring vehicle ownership rates. The result is that arterial roads reach saturation during peak hours, rendering the entire network ineffective. Compounding this is the phenomenon of urban sprawl: as cities spread outwards without proportional investment in public transport links, residents find themselves obliged to drive ever-greater distances, perpetuating a cycle of dependency.

A secondary, albeit equally significant, cause is the failure of urban planning authorities to anticipate long-term demographic growth. Many city road networks were designed in the mid-twentieth century for populations a fraction of their current size, with no provision for the exponential growth in vehicle ownership that market liberalisation would bring. The absence of integrated transport planning — wherein residential, commercial and recreational zones are treated as a single system — has meant that journey-to-work distances have lengthened dramatically across many metropolitan regions.

To address these structural causes, governments must prioritise large-scale investment in multimodal public transport. Singapore and Amsterdam offer compelling proof that a combination of frequent, affordable metro services and targeted congestion pricing can dramatically reduce private car use. Such schemes function not merely as revenue generators, but as behavioural nudges that make public transit the rational default choice.

In tandem with this, urban planners should adopt mixed-use zoning frameworks, integrating housing, workplaces and amenities within walkable and cyclable neighbourhoods. Copenhagen's success in achieving a 62% cycling commuter rate demonstrates that when the built environment prioritises active travel, private vehicle dependency diminishes organically.

In conclusion, while urban traffic congestion is a product of deep structural causes rooted in historical planning decisions and transport policy failures, evidence-based investment in public transit and mixed-use urban design offers a credible and proven path towards more liveable cities.`,
    annotations: [
      {
        startIndex: 0,
        endIndex: 90,
        text: 'Urban traffic congestion represents one of the defining infrastructure challenges',
        note: '📌 Strong Thesis Opening: Directly states the topic\'s significance. "Defining" is a precise word choice — not "big" or "important". The phrase "defining... challenges" is academic register.',
        type: 'task',
      },
      {
        startIndex: 340,
        endIndex: 425,
        text: 'The principal driver of gridlock in most cities is the dominant position of private car ownership',
        note: '📌 Clear Cause Topic Sentence: "The principal driver" signals this is Cause 1. Examiners can immediately identify the paragraph structure — this is Task Achievement (TR) excellence.',
        type: 'task',
      },
      {
        startIndex: 680,
        endIndex: 770,
        text: 'Compounding this is the phenomenon of urban sprawl',
        note: '🔥 Fronted Participle Clause: "Compounding this is..." — an inverted structure that elegantly links to the previous point. Adds cohesion without overusing "Furthermore" or "Also".',
        type: 'structure',
      },
      {
        startIndex: 1050,
        endIndex: 1100,
        text: 'A secondary, albeit equally significant, cause',
        note: '📖 Concessive Parenthetical: "albeit equally significant" — the conjunction "albeit" (= although) is used within a noun phrase. High-register signal for Lexical Resource.',
        type: 'vocabulary',
      },
      {
        startIndex: 1600,
        endIndex: 1680,
        text: 'Such schemes function not merely as revenue generators, but as behavioural nudges',
        note: '🔥 Correlative Structure: "not merely as X, but as Y" — an elegant paired structure that avoids the overused "not only... but also". Shows lexical variety in cohesive devices.',
        type: 'structure',
      },
    ],
    structures: [
      { name: 'Fronted Participle', example: 'Compounding this is the phenomenon of urban sprawl', explanation: 'Inverted structure with a fronted present participle: "Compounding this is X" instead of "X compounds this". Elegant alternative to simple connectors.' },
      { name: 'Concessive Parenthetical', example: '...albeit equally significant...', explanation: '"Albeit" = "although" — used within a noun phrase as a parenthetical. Extremely formal register, signals sophisticated Lexical Resource.' },
      { name: 'Correlative "not merely... but"', example: 'not merely as revenue generators, but as behavioural nudges', explanation: 'Elegant variant of "not only... but also". Shows awareness of cohesive variety and avoids mechanical repetition of set phrases.' },
      { name: 'Embedded Relative Clause', example: 'wherein residential, commercial and recreational zones are treated as a single system', explanation: '"Wherein" = "in which" — an archaic-but-formal relative pronoun that elevates register. Used precisely in legal and academic writing.' },
    ],
    keyPhrases: [
      'soaring vehicle ownership rates', 'perpetuating a cycle of dependency',
      'exponential growth', 'market liberalisation', 'multimodal public transport',
      'behavioural nudges', 'the rational default choice', 'mixed-use zoning frameworks',
      'active travel', 'more liveable cities',
    ],
  },
  {
    id: 'model-3',
    assignmentId: 'assign-3',
    bandScore: 9.0,
    teacherNotes: 'A masterclass in Task 1 academic writing. The overview paragraph (second paragraph) is precise and immediately identifies the two overarching trends — the British Museum\'s dominance and the pandemic disruption. Data is integrated naturally into complex sentences rather than listed mechanically. Notice the variety of comparison language: "significantly outpacing", "dwarfed", "surged", "rebounded". The tense control (past simple for trends, past perfect for contextualisation) is flawless.',
    content: `The bar chart presents data on visitor numbers to three major London museums — the British Museum, the Natural History Museum, and the Victoria and Albert Museum — over a five-year period spanning 2019 to 2023.

Overall, the British Museum consistently attracted the largest visitor volumes throughout the period, while all three institutions experienced a dramatic collapse in attendance in 2020 before staging a sustained recovery. By 2023, visitor figures had largely returned to or exceeded pre-pandemic levels.

In 2019, the British Museum welcomed approximately 6.2 million visitors, significantly outpacing its counterparts: the Natural History Museum recorded 4.4 million and the Victoria and Albert 3.8 million. The onset of the COVID-19 pandemic in 2020 triggered a precipitous decline across all venues, with the British Museum's figures plummeting to just 1.7 million — a reduction of over 70% — while the Natural History Museum and the Victoria and Albert saw comparably severe contractions to 1.0 and 0.9 million respectively.

The recovery trajectory proved broadly consistent across the three institutions. Visitor numbers began to climb in 2021, with moderate but meaningful gains at each venue. The most pronounced rebound was recorded between 2021 and 2022, when the British Museum's attendance surged from 3.5 to 5.8 million, recovering to approximately 94% of its 2019 peak. Most notably, by 2023, the Natural History Museum had surpassed its pre-pandemic total, reaching 4.7 million, while the Victoria and Albert achieved a new record of 4.1 million — demonstrating that, for these two institutions at least, the pandemic ultimately proved only a temporary setback.`,
    annotations: [
      {
        startIndex: 0,
        endIndex: 55,
        text: 'The bar chart presents data on visitor numbers',
        note: '📌 Precise Task 1 Opening: Uses the exact task type ("bar chart"), the exact measurement ("visitor numbers"), and the exact timeframe in the next clause. No paraphrasing the chart title word-for-word — this is your own academic sentence.',
        type: 'task',
      },
      {
        startIndex: 200,
        endIndex: 360,
        text: 'Overall, the British Museum consistently attracted the largest visitor volumes throughout the period, while all three institutions experienced a dramatic collapse in attendance in 2020 before staging a sustained recovery',
        note: '📌 Band 9 Overview: A single sentence captures TWO key trends — relative dominance AND the pandemic pattern. The overview must select main features (not all data), and "Overall" signals this clearly to examiners. This is where TR marks are won.',
        type: 'task',
      },
      {
        startIndex: 490,
        endIndex: 575,
        text: 'significantly outpacing its counterparts',
        note: '📖 Comparative Lexis: "outpacing" (not "more than") + "counterparts" (not "other museums") — precise, varied comparison vocabulary that avoids mechanical phrasing. Contributes to a high LR band.',
        type: 'vocabulary',
      },
      {
        startIndex: 680,
        endIndex: 760,
        text: "a reduction of over 70% — while the Natural History Museum and the Victoria and Albert saw comparably severe contractions",
        note: '📊 Data Integration: Percentage change is calculated and stated, not just listed. "Contractions" (not "decreases") shows vocabulary variety. Em-dash used for parenthetical effect — very sophisticated punctuation control.',
        type: 'vocabulary',
      },
      {
        startIndex: 1050,
        endIndex: 1130,
        text: 'had surpassed its pre-pandemic total',
        note: '🔥 Past Perfect Tense: "had surpassed" correctly signals that this action (surpassing pre-pandemic levels) was completed by 2023. Accurate tense sequencing is a key GRA criterion for Task 1.',
        type: 'grammar',
      },
    ],
    structures: [
      { name: 'Two-Trend Overview', example: 'Overall, the British Museum consistently attracted the largest volumes... while all three... experienced a dramatic collapse... before staging a sustained recovery.', explanation: 'The overview must compress the two most important trends into 1-2 sentences using subordination. This avoids listing all data points (which is a common Band 5 mistake).' },
      { name: 'Calculated Percentage Change', example: 'a reduction of over 70%', explanation: 'Rather than simply quoting both figures, calculate and state the change. This demonstrates analytical thinking, which is the core of Task 1 TR.' },
      { name: 'Past Perfect for Completed Action by a Reference Point', example: 'by 2023, the Natural History Museum had surpassed its pre-pandemic total', explanation: '"had + past participle" correctly signals that the surpassing was completed by 2023. Critical for accurate tense sequencing across time periods.' },
      { name: 'Concessive "at least" Qualifier', example: 'for these two institutions at least, the pandemic ultimately proved only a temporary setback', explanation: 'Hedging with "at least" and "ultimately" shows academic precision — you are qualifying the claim to what the data actually supports, not overgeneralising.' },
    ],
    keyPhrases: [
      'consistently attracted', 'dramatic collapse in attendance', 'staged a sustained recovery',
      'precipitous decline', 'comparably severe contractions', 'pronounced rebound',
      'broadly consistent', 'broadly consistent recovery trajectory', 'only a temporary setback',
    ],
  },
];

export const mockBadges: Badge[] = [
  {
    id: 'badge-sharp-eye',
    name: 'Sharp Eye',
    description: 'Left 5+ inline grammar comments in a single review',
    emoji: '👁️',
    color: '#dc2626',
    earnedAt: '2026-09-17T14:00:00Z',
  },
  {
    id: 'badge-streak-3',
    name: 'On a Roll',
    description: 'Maintained a 3-day activity streak',
    emoji: '🔥',
    color: '#f97316',
    earnedAt: '2026-09-16T09:00:00Z',
  },
];
