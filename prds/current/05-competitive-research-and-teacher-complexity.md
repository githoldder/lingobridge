# 05 Competitive Research + Teacher Complexity Baseline

> Created: 2026-06-06
> Scope: competitor research for international Chinese / language-learning / LMS analytics products, and implications for LingoBridge 2.0 teacher, student, admin, and AI-data workflows.

## 1. Executive Summary

LingoBridge 2.0 should not present itself as a generic course CRUD demo. The competitive baseline for an international Chinese education platform is a hybrid of four product families:

1. Language-learning engagement systems, represented by Duolingo for Schools and HelloChinese.
2. Chinese-specific skill systems, represented by Skritter, ChineseSkill, and LingoAce.
3. Teacher-facing LMS analytics systems, represented by Canvas and Moodle.
4. Online classroom systems, represented by ClassIn.

The current repository has the foundations for courses, homework, recordings, classroom live flow, admin audit data, and an AI prototype, but teacher and student surfaces are still under-composed. The product should move toward role-specific intelligence:

- Student: learning path, knowledge graph tracking, personal ranking, weak-point practice.
- Teacher: class diagnosis, pronunciation/tone weakness map, grading queue, intervention tasks, resource/courseware quality, individual student evidence.
- Admin: end-to-end data-center monitoring, data audit, multimedia trace, model quality, pipeline health, dataset/report reproducibility.

## 2. Competitor Evidence

### Duolingo for Schools

Relevant patterns:

- Teacher dashboard uses a right-side activity log to show current student progress, assignment completion, XP, and active unit. It updates in real time and links into student profiles and assignment reports.
- Co-teacher / observer access can monitor student progress, but assignment visibility can be scoped by teacher.

Implication for LingoBridge:

- Student knowledge-tracing rail should have a corresponding teacher-side class activity rail.
- Teacher dashboard should not only show total students/courses; it should show recent practice, current unit/lesson node, assignment completion, and students needing attention.
- Privacy and role scope matter: teachers can see their own classes, admin sees global data, student sees self + anonymized cohort only.

Sources:

- Duolingo for Schools activity log: https://duolingoschools.zendesk.com/hc/en-us/articles/6894350549773-What-is-the-Duolingo-for-Schools-activity-log-
- Duolingo for Schools multi-teacher monitoring: https://duolingoschools.zendesk.com/hc/en-us/articles/6893034033421-Can-more-than-one-teacher-monitor-the-same-students

### Canvas LMS Analytics

Relevant patterns:

- Instructor analytics include course grade, weekly online activity, communication, chart/table switching, and student-level analytics.
- Course analytics data is derived from a data platform and only includes active/completed enrollments.

Implication for LingoBridge:

- Teacher analytics need both aggregate class charts and per-student drill-down.
- Metrics must be tied to data eligibility rules: active enrollments, course/class scope, stale/missing data indicators.
- Teacher students page should become a real class information management and intervention console, not a flat roster.

Source:

- Canvas instructor course analytics: https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-view-Course-Analytics-in-a-course-as-an-instructor/ta-p/801

### Moodle Learning Analytics

Relevant patterns:

- Moodle frames analytics models as indicators, targets, insights, notifications, and actions.
- It warns that model selection should depend on institutional goals.

Implication for LingoBridge:

- The AI data console should explicitly separate features/indicators, prediction targets, generated insights, notifications, and teacher/student actions.
- Teacher dashboards should include actionable interventions, not only charts.

Source:

- Moodle using analytics: https://docs.moodle.org/en/Using_analytics

### ClassIn

Relevant patterns:

- ClassIn positions itself as an integrated live classroom + LMS + personal learning environment.
- Feature vocabulary includes collaborative blackboard, collaborative documents, group teaching, virtual experiments, homework, discussions, assessments, learning pathway, and evaluation data.

Implication for LingoBridge:

- International Chinese complexity should show live classroom artifacts: recordings, bilingual captions, danmaku, courseware, homework, assessment, student speaking evidence, and teacher intervention all connected.
- Multimedia monitoring belongs not only in admin; teachers need scoped replay and evidence review.

Source:

- ClassIn app description: https://apps.apple.com/us/app/classin/id1226361488

### LingoAce

Relevant patterns:

- LingoAce emphasizes research-based Mandarin curriculum, teacher matching, global learners, proficiency levels, progress reports, and course service.

Implication for LingoBridge:

- Teacher home should expose international Chinese pedagogy: HSK/ACTFL-style level, pinyin/tone/character/vocabulary skill taxonomy, curriculum coverage, and learner background tags.
- Class/student management should include proficiency, learning goals, heritage/non-heritage learner profile, timezone/language preference, and teacher follow-up notes.

Sources:

- LingoAce home: https://www.lingoace.com/
- LingoAce FAQ: https://www.lingoace.com/faq/

### Skritter

Relevant patterns:

- Classroom progress includes date range filters, time studied, days studied, learned items, studied cards, success rate, student activities, and assignment/test/review filtering.
- Student progress includes streaks, daily/overall progress, active study time, success rate, activity feed, words learned, unique characters, retention, and study days.

Implication for LingoBridge:

- Chinese-specific teacher and student views should track character/vocabulary learning, tone practice, recording attempts, review/test modes, success rate, and activity feed.
- The student personal ranking page should not be just a leaderboard; it should combine streak, mastery, retention, and weak-node explanations.

Sources:

- Skritter classroom progress: https://docs.skritter.com/article/32-overall-classroom-progress
- Skritter classroom overview: https://docs.skritter.com/article/61-what-is-skritter-classroom
- Skritter streaks/goals/progress: https://docs.skritter.com/article/262-streaks-goals-and-progress

### HelloChinese / ChineseSkill

Relevant patterns:

- HelloChinese highlights game-based bite-sized curriculum, reading/writing/speaking/vocabulary/grammar, speech recognition, handwriting, native-speaker videos, and spaced repetition.
- ChineseSkill emphasizes CSL design, HSK vocabulary/flashcards/games/listening, tone training, speaking practice, AI tutor, and offline learning.

Implication for LingoBridge:

- Student and teacher modules should show Chinese-language learning dimensions, not only generic "assignments": pinyin, tones, characters, vocabulary, grammar, listening, speaking, handwriting/courseware, SRS/review.
- Multimedia evidence should include pronunciation/recording scoring and native/bilingual caption material.

Sources:

- HelloChinese official features: https://www.hellochinese.cc/en
- ChineseSkill official site: https://www.chineseskill.com/
- ChineseSkill app listing: https://play.google.com/store/apps/details?id=com.chineseskill

## 3. Public Dataset and AI Research Baseline

The next data-science phase should use public educational datasets for engineering rigor and reproducibility, while mapping their concepts into LingoBridge's Chinese-learning domain.

Candidate datasets:

- EdNet: large-scale hierarchical education dataset with over 131M interactions from 784K students, designed for knowledge tracing and learning path recommendation research.
- KDD Cup 2010: classic educational data mining challenge dataset for predicting student answer correctness from intelligent tutoring data.
- ASSISTments: education tool/dataset ecosystem focused on practice and real-time data for teachers.
- Junyi Academy: public online learning activity dataset used in educational data analysis and knowledge tracing.

Recommended sequence:

1. Use local synthetic LingoBridge data for demo stability.
2. Add a reproducible public dataset notebook/pipeline with EdNet or ASSISTments/KDD Cup sample.
3. Normalize public dataset events into the same `LearningTraceEvent` schema.
4. Run baseline, DKT, clustering, recommendation, and graph visualizations.
5. Export figures and tables into `docs/05-lecture-delivery/报告`.

Sources:

- EdNet paper: https://arxiv.org/abs/1912.03072
- KDD Cup 2010 overview: https://learning-analytics-toolbox.org/dataset/the-2010-kdd-cup-competition-dataset/
- KDD Cup 2010 official results/data context: https://www.kdd.org/kdd-cup/view/kdd-cup-2010-student-performance-evaluation/Results
- ASSISTments official site: https://www.assistments.org/
- Junyi Academy dataset: https://www.kaggle.com/datasets/junyiacademy/learning-activity-public-dataset-by-junyi-academy/data

## 4. Product Gap Matrix

| Role | Current Product Shape | Competitive Baseline | Required LingoBridge 2.0 Upgrade |
|---|---|---|---|
| Student home | Course/homework shortcuts, light stats. | Streak, daily goals, activity feed, adaptive review, progress. | Add AI learning assistant, weak skills, streak, next best practice, ranking entry. |
| Student homework | Real homework/recording flow plus visual side cards. | Duolingo-like path + Skritter-like progress. | Add knowledge-tracing rail, KG preview, learning trace, recommendations. |
| Student ranking | Not implemented as route. | Rank is less important than progress + mastery. | Add personal ranking/learning analytics page with anonymized peer distribution. |
| Teacher home | Course/task/student counts, recent activity. | Activity log, students needing attention, course analytics, interventions. | Add class diagnosis, AI insight queue, weak-point heatmap, grading/review queue, upcoming live/media evidence. |
| Teacher students | Flat roster + course count + progress modal. | Student analytics drill-down, activity history, date filters, progress/risk. | Add class/student management table with proficiency, attendance, completion, recording score, weak points, risk, intervention status. |
| Teacher class/course | Course CRUD and lesson details. | Assignment reports, unit progress, content coverage, classroom artifacts. | Add course quality, HSK/skill coverage, homework import quality, caption/courseware/media evidence. |
| Admin data console | Dense AI/data charts in progress. | Data platform monitoring + audit + learning analytics. | Add cross-role monitoring: student KG/ranking, teacher interventions, multimedia data, dataset pipeline, model registry. |
| Experiment report | DKT/KG prototype exists. | Reproducible public datasets + traceable pipelines. | Add public dataset ingestion, data dictionary, pipeline DAG, model comparison, figures, audit trail. |

## 5. Teacher-Side Module Requirements

### 5.1 Teacher Home Dashboard

Required modules:

- Today teaching operations: upcoming live classes, homework due today, recordings pending review, courseware needing attention.
- Class learning health: completion rate, average recording score, weak pinyin/tone/vocabulary nodes, high-risk students.
- Activity log: latest submissions, recordings, caption corrections, courseware imports, student practice streaks.
- Intervention queue: students needing reminder, pronunciation retest, makeup homework, teacher note.
- AI insight cards: DKT/baseline risk, knowledge graph weak prerequisites, recommendation coverage, model confidence warning.

### 5.2 Teacher Student / Class Management

Required fields:

- Identity: anonymized student code, display name, native language, timezone, learner type.
- Enrollment: classes, course level, HSK/CEFR/ACTFL-like level tag, current lesson node.
- Learning behavior: last active time, weekly study minutes, homework completion, recording attempts, days studied.
- Chinese-specific mastery: pinyin, tones, characters, vocabulary, listening, speaking.
- Risk and intervention: riskLevel, weakKnowledgePoints, recommended action, teacher note status.
- Evidence links: recordings, caption/subtitle segments, homework fields, courseware references.

Required interactions:

- Filter by class, course, risk, weak point, missing homework, low recording score.
- Open student profile drawer with activity timeline and KG overlay.
- Assign intervention action: reminder, retest, extra practice, note follow-up.
- Export class report metadata for admin/report use.

### 5.3 Teacher Reports / Analytics

Required reports:

- Assignment completion report.
- Recording/pronunciation report.
- Knowledge point mastery report.
- Courseware coverage report.
- Class comparison and trend report.
- AI recommendation effectiveness report.

## 6. Updated Delivery Logic

The sprint plan should follow this order:

1. Demo first: data console modules and backend contracts work end to end.
2. Data science second: public dataset acquisition, ingestion, cleaning, feature engineering, modeling, charts, audit trail, report figures.
3. Product depth third: remove student/teacher mocks, add student dashboards, teacher dashboards, class/student management complexity.
4. Documentation last: synchronize LingoBridge 2.0 into `docs/00-project-docs` software engineering documents.

This order protects the demo while still moving the platform toward a credible international Chinese education product.
