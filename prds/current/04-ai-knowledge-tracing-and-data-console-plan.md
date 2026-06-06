# 04 AI Knowledge Tracing + Data Console Landing Plan

> Created: 2026-06-06
> Scope: student homework knowledge-tracing sidebar, personal ranking page, knowledge graph tracking, lightweight DKT, and admin data-console monitoring.
> Status: planning baseline for implementation; use with `00-latest-product-decisions.md` and `02-product-boundary-and-business-rules.md`.

## 1. Executive Judgment

The previous plan is directionally correct but not yet implementation-complete. It improves the admin console visual language and mentions machine-learning partitions, but it still leaves three product gaps unresolved:

1. Student-side AI feedback loop is missing. `HomeworkView.tsx` already has a mindmap card and ranking/records buttons, but they are only visual shortcuts. There is no real personal ranking page, no knowledge graph tracking view, and no data contract connected to the Python AI output.
2. Analytics backend is missing. Current PRDs mention `/api/v1/analytics/student-profile`, `/class-insights`, `/admin-snapshot`, and `/run-pipeline`, but the current code only exposes admin operational endpoints such as recordings, notes, transcripts, coursewares, assignment imports, and `/api/v1/admin/learning-progress`.
3. The Python AI prototype exists, but it is not a platform feature yet. `analysis/ai-learning-recommendation` already contains a NetworkX knowledge graph, a PyTorch LSTM DKT prototype, metrics, ROC/loss figures, and recommendations. These outputs need to be normalized into product-facing JSON and served through typed APIs.

Therefore, the next implementation should not add more dense widgets to the admin home page. It should create a small closed loop:

`Homework learning event -> offline AI profile/recommendation output -> student sidebar/ranking page -> teacher class intervention -> admin monitoring snapshot`.

## 2. Repo Reality Audit

| Area | Current Reality | Gap |
|---|---|---|
| Student homework side rail | `HomeworkView.tsx` has syllabus, mindmap, mistakes/favorites/ranking/records shortcuts. | No Duolingo-like knowledge tracking sidebar state, no graph preview modal/page, ranking button not wired to a ranking page. |
| Student navigation | `App.tsx` only routes student tabs: dashboard, schedule, vocabulary, homework, classroom. | Need a protected student ranking/learning analytics view or an embedded homework subview. |
| Teacher dashboard | `TeacherDashboardView.tsx` shows course/student/task counts, upcoming courses, and light activity. | Need international Chinese teaching operations: class diagnosis, grading queue, weak pinyin/tone/vocabulary map, intervention tasks, multimedia evidence. |
| Teacher students | `TeacherStudentsView.tsx` is mostly roster search, course count, status, and a progress modal. | Need class/student management: proficiency, learning behavior, risk, weak points, recordings, homework evidence, teacher notes, intervention status. |
| Admin data console | `AdminDashboardView.tsx` now has dense i18n UI, charts, pipeline/model visualization, DKT references. | Needs explicit monitoring for knowledge graph, ranking pipeline, graph node coverage, recommendation freshness, and student trace health. |
| Backend | `backend/src/app.ts` has `/api/v1/admin/*` operational endpoints and `/api/v1/admin/learning-progress`. | No `/api/v1/analytics/*` contract for student profile, ranking, graph, recommendations, or admin AI snapshot. |
| Frontend API client | `src/services/apiClient.ts` has `adminApi`, no analytics client. | Need `analyticsApi` with typed DTOs. |
| AI prototype | NetworkX graph + PyTorch DKT + metrics/recommendations already exist. | Outputs are prototype-shaped, not role-shaped for student/teacher/admin. |
| Course report alignment | `docs/05-lecture-delivery` already frames DKT, Levenshtein, KG, ranking, and admin monitoring. | Product UI and backend need to reflect that report narrative. |

## 3. Lightweight DKT Research Notes

Use a conservative, explainable knowledge-tracing stack.

- Deep Knowledge Tracing is a sequence-modeling method that uses recurrent neural networks to model student knowledge over time; the original DKT paper frames knowledge tracing as modeling student knowledge from coursework interactions and uses RNNs/LSTMs for prediction. Source: NeurIPS DKT paper, Piech et al. 2015, https://papers.neurips.cc/paper/5654-deep-knowledge-tracing and arXiv https://arxiv.org/abs/1506.05908.
- For this repository, the current implementation is already lightweight: single-layer PyTorch LSTM, input dimension `2 * num_skills`, hidden size 64, next-step masking, CPU training, no online inference service.
- The current experiment honestly shows DKT underperforming the non-leakage historical baseline on small synthetic data: DKT AUC `0.5386` vs baseline AUC `0.5908`. This should not be hidden. It is a useful product story: cold-start systems should show baseline + DKT side by side, then promote DKT when long-term data accumulates.
- For knowledge graph storage, Neo4j's official model is node + relationship + property graph. Source: Neo4j graph concepts, https://neo4j.com/docs/getting-started/appendix/graphdb-concepts/. This is appropriate for a later graph database layer, but it is not required for the first demo loop.
- For browser graph rendering, Cytoscape.js is a JavaScript graph visualization and analysis library that can run in the browser. Source: https://js.cytoscape.org/. It is a better P1 visualization choice than running Neo4j directly in the frontend.

Recommended stance:

- P0: keep DKT offline, keep historical baseline visible, use JSON graph output from NetworkX.
- P1: expose typed analytics APIs and render an interactive graph in React.
- P2: add Neo4j as optional persistence if the course/demo specifically needs graph-database evidence.

## 4. Product Architecture

### 4.1 Student Homework Knowledge Tracking Sidebar

Location: `HomeworkView.tsx`, right side of the learning path/homework board.

Design goal: a Duolingo-like learning side rail that feels motivating but still academic and explainable.

Required blocks:

- Learning streak and recent practice summary: last 7 days, completed tasks, recording attempts, average score.
- Knowledge graph preview: top 5 active nodes, weak nodes, prerequisite chain, click to open graph detail.
- Dynamic trace timeline: latest homework submission, recording score, corrected subtitle/caption event, weak-skill update.
- Personal ranking entry: rank percentile, class rank, trend arrow, click to open ranking page.
- Recommendations: 2 to 3 exercises with reason text from DKT/baseline/KG signals.

Implementation rule:

- Do not touch recording, draft, submit, or local media logic in `HomeworkView.tsx`.
- Add a separate presentational component, for example `StudentKnowledgeTraceRail.tsx`, and pass mock/analytics data into it.

### 4.2 Personal Ranking / Learning Analytics Page

New route candidate: `student-ranking`.

Required content:

- Personal rank card: class rank, percentile, week-over-week trend.
- Peer comparison chart: anonymized class distribution, current student marker.
- Mastery radar: pinyin, tone, vocabulary, listening, homework completion.
- Weak knowledge nodes: graph-tag list with prerequisite explanation.
- Learning records: filterable timeline of homework, recording, ASR/caption, recommendation acceptance.
- Recommendation panel: next practice steps with explainable source signals.

Data privacy:

- Student sees own details and anonymized cohort distribution only.
- No real peer names in the ranking page.

### 4.3 Knowledge Graph Tracking

P0 representation:

- Use `analysis/ai-learning-recommendation/output/knowledge_graph.json`.
- Keep schema close to Neo4j so migration is easy:
  - Node: `id`, `name`, `category`, `mastery`, `risk`, `pagerank`, `inDegree`, `outDegree`.
  - Edge: `source`, `target`, `type`, `weight`.
- Render as static mini graph or lightweight SVG in the rail.

P1 visualization:

- Add an interactive graph component with Cytoscape.js or a local SVG force layout.
- Support node categories: Pinyin, Tone, Character, Vocabulary.
- Clicking a node shows mastery, latest events, prerequisite nodes, and recommended exercises.

P2 Neo4j adapter:

- Add optional `backend/src/repositories/knowledgeGraph.ts`.
- Store `(:KnowledgePoint {id,name,category})-[:PREREQUISITE_OF]->(:KnowledgePoint)`.
- Do not require Neo4j for local demo startup unless explicitly enabled.

### 4.4 Admin Monitoring

Admin data console should monitor the AI loop, not just display charts.

Add or refine these monitoring panels:

- Pipeline health: raw events, cleaned events, feature rows, model run time, invalid samples.
- Knowledge graph health: node count, edge count, orphan nodes, graph version, latest graph build time.
- DKT/baseline model board: DKT AUC, baseline AUC, sample size, cold-start warning, last training time.
- Ranking health: number of ranked students, anonymization status, stale profiles, missing records.
- Recommendation health: active recommendations, accepted recommendations, weak-node coverage.
- Multimedia trace health: recordings with AI score, caption segments, danmaku/subtitle correction queue.

### 4.5 Teacher Class Intelligence

Teacher-side work is required for LingoBridge to look like an international Chinese education platform rather than a generic LMS.

Teacher dashboard modules:

- Teaching operations: upcoming classes, homework due today, recordings pending review, courseware import quality.
- Class learning health: completion rate, weekly study time, average recording score, weak pinyin/tone/character/vocabulary nodes.
- Student risk queue: high-risk students, missing homework, low recording score, stale activity, weak prerequisite chains.
- AI intervention suggestions: reminder, retest, extra practice, teacher note, parent/admin escalation.
- Multimedia evidence: latest student recordings, bilingual caption segments, danmaku/caption corrections, classroom replay links.

Teacher students/class management modules:

- Student roster with native language, timezone, learner type, current HSK/level tag, active course, current lesson node.
- Learning behavior fields: last active time, days studied, study minutes, homework completion, recording attempts.
- Mastery fields: pinyin, tone, character, vocabulary, listening, speaking, weak knowledge points.
- Operational fields: riskLevel, interventionStatus, teacherNoteStatus, nextRecommendedAction.
- Drill-down drawer: activity timeline, knowledge graph overlay, recordings, assignment evidence, recommendation history.

## 5. API and Data Contract Plan

### 5.1 Backend Endpoints

P0/P1 endpoints:

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/api/v1/analytics/student-profile?studentId=` | student/self, teacher limited, admin | Profile, risk, mastery, weak nodes. |
| GET | `/api/v1/analytics/student-ranking?studentId=&classId=` | student/self | Personal rank and anonymized distribution. |
| GET | `/api/v1/analytics/knowledge-graph?studentId=` | student/self, teacher aggregate, admin | Graph nodes/edges with mastery overlay. |
| GET | `/api/v1/analytics/recommendations?studentId=` | student/self | Explainable practice recommendations. |
| GET | `/api/v1/analytics/class-insights?classId=` | teacher, admin | Class risk, weak nodes, assignment/recording health, intervention queue. |
| GET | `/api/v1/analytics/teacher-interventions?classId=` | teacher, admin | Suggested teacher actions and status tracking. |
| GET | `/api/v1/analytics/admin-snapshot` | admin | Global AI/data-console monitoring snapshot. |
| POST | `/api/v1/analytics/run-pipeline` | admin | Optional manual trigger; can be stubbed before real runner. |

### 5.2 Frontend API Client

Add `analyticsApi` in `src/services/apiClient.ts`.

DTOs:

- `StudentLearningProfile`
- `StudentRankingSnapshot`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- `KnowledgeGraphSnapshot`
- `LearningTraceEvent`
- `PracticeRecommendation`
- `ClassInsight`
- `TeacherIntervention`
- `AdminAnalyticsSnapshot`

### 5.3 Output JSON Normalization

Current prototype outputs:

- `metrics.json`
- `knowledge_graph.json`
- `recommendations.json`
- `dkt_training_loss.png`
- `dkt_roc_curve.png`

Needed product outputs:

- `student_profiles.json`
- `student_rankings.json`
- `knowledge_graph_snapshot.json`
- `learning_trace_events.json`
- `class_insights.json`
- `teacher_interventions.json`
- `admin_snapshot.json`

Rule: image artifacts are allowed for report/admin visual explanation, but product UI should prefer JSON-driven charts when possible.

## 6. Implementation Phases

### P0: Close the Demo Loop

Goal: make the AI story visible across admin + student + teacher without adding infrastructure.

Tasks:

1. Create normalized mock analytics JSON in `analysis/ai-learning-recommendation/output/`.
2. Add frontend mock fallback data for student knowledge rail and ranking page.
3. Add `StudentKnowledgeTraceRail.tsx`.
4. Add `StudentRankingView.tsx` and route `student-ranking`.
5. Wire Homework quick-access ranking and graph buttons to the new view/modal.
6. Add teacher mock analytics cards for class risk, weak points, recording review, and intervention queue.
7. Add admin monitoring widgets for graph/ranking/recommendation/teacher-intervention freshness.

Estimated effort: 2 to 4 focused engineering days.

### P1: Backend API Integration

Goal: stop direct mock usage and make the data flow realistic.

Tasks:

1. Add read-only `/api/v1/analytics/*` routes.
2. Add `analyticsApi` frontend client and DTOs.
3. Read JSON outputs from the Python output directory with safe fallback.
4. Add class insights and teacher intervention endpoints.
5. Add smoke tests for each analytics endpoint.
6. Use role checks: student self access, teacher aggregate access, admin global access.

Estimated effort: 2 to 3 focused engineering days.

### P2: Graph DB + Stronger Model Layer

Goal: make Neo4j and DKT more than a mock if required by course/demo emphasis.

Tasks:

1. Add optional Neo4j docker/service profile and seed script.
2. Add graph repository adapter.
3. Add pipeline export/import from NetworkX JSON to Neo4j.
4. Add model registry fields: model version, train set size, eval split, DKT vs baseline comparison.
5. Add scheduled/offline pipeline runner.

Estimated effort: 4 to 8 focused engineering days, depending on whether Neo4j must be run locally and demo-stable.

## 7. Workload and Difficulty Assessment

| Requirement | Difficulty | Reason |
|---|---:|---|
| Student Duolingo-like sidebar with mock data | Medium | UI composition only, but must avoid breaking existing homework logic. |
| New personal ranking page | Medium | Requires route, i18n, charts, anonymized data shape. |
| Teacher dashboard AI/class intelligence | Medium-High | Requires more information architecture and role-specific data fields than the student rail. |
| Teacher student/class management upgrade | Medium-High | Needs richer table fields, filters, drawer, teacher actions, and privacy constraints. |
| Admin monitoring for knowledge tracing | Medium | Existing admin console can absorb it, but information architecture must stay modular. |
| JSON-driven knowledge graph visualization | Medium | NetworkX output already exists; frontend graph needs careful responsive layout. |
| Backend read-only analytics API | Medium | Straightforward Express work, but needs privacy and fallback rules. |
| True DKT model improvement | High | Requires real longitudinal data; current synthetic data is too small for robust DKT superiority. |
| Neo4j production-like graph DB | High | Adds service lifecycle, seed/migration, Cypher, local setup, and deployment complexity. |
| Live Python/Manim animation in browser | High / not recommended | Better to use React/SVG animation for browser runtime; Python-generated assets can remain offline/report artifacts. |

## 8. Acceptance Criteria

P0 is complete when:

- Homework right side shows a knowledge tracing rail with learning records, KG preview, weak nodes, rank entry, and recommendations.
- Ranking entry opens a personal ranking/learning analytics view.
- Student ranking page shows anonymized distribution and mastery/weak-node data.
- Teacher dashboard shows class health, weak skills, intervention queue, and multimedia review entry points.
- Teacher students page shows role-appropriate risk/mastery fields and drill-down evidence.
- Admin console has a clear AI monitoring module for DKT/baseline, KG, ranking, recommendations, and multimedia traces.
- No recording/submission/homework persistence logic is changed.

P1 is complete when:

- `analyticsApi` exists and all new views can load from `/api/v1/analytics/*` with mock fallback.
- Backend serves normalized JSON from AI output files.
- Admin-only snapshot is protected; student endpoints do not leak peer names.
- Smoke tests or manual API checks cover all analytics endpoints.

P2 is complete when:

- Optional Neo4j graph can be seeded and queried.
- Graph DB absence does not break local demo.
- DKT evaluation clearly reports sample size, baseline comparison, and model limitations.

## 9. Open Decisions

1. Route strategy: create a full `student-ranking` tab or use a homework subview/modal? Recommendation: create a full route because the report explicitly references a personal ranking page.
2. Teacher route strategy: enhance existing `teacher-dashboard`, `students`, and `reports` routes before adding new routes.
3. Graph rendering library: Cytoscape.js vs custom SVG. Recommendation: custom SVG for P0, Cytoscape.js for P1 if interaction becomes important.
4. Neo4j priority: demo evidence vs engineering cost. Recommendation: keep Neo4j as P2 optional adapter; use NetworkX JSON first.
5. Data source: current synthetic output vs backend aggregated records. Recommendation: synthetic output for P0, backend aggregation bridge for P1.

## 10. Next Implementation Order

1. Stabilize admin data-console demo contracts and backend connectivity.
2. Add product-facing mock analytics data and DTOs for student, teacher, admin.
3. Add student ranking route and page shell.
4. Extract homework AI side rail component and wire ranking/graph buttons.
5. Upgrade teacher dashboard/students/reports around class intelligence and intervention.
6. Add admin AI monitoring cards using the same analytics data shape.
7. Run public dataset pipeline and export report figures.
8. Add backend analytics API after the UI contract stabilizes.
9. Add optional graph visualization and Neo4j adapter upgrades.
