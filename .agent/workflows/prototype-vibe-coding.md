# Prototype Vibe Coding Workflow

This workflow guides developers and agents through rapid, low-friction product prototyping and "Vibe Coding" inside LingoBridge while maintaining strict MVP boundaries.

---

## 1. Core Principles of Vibe Coding

1. **Screen-First Design**: Start by making the primary screen/route fully visible and interactive. Do not build abstract service layers or database models before the UI is rendered.
2. **Happy Path First**: Focus purely on the successful execution loop. Implement edge cases and complex validation states only after the happy path compiles.
3. **Strict MVP Bounds**: LingoBridge is a highly specialized CZU learning workflow, not a broad SaaS or general Learning Management System (LMS). Reject all features introducing multi-tenant administration, billing, complex sub-classifications, or unneeded analytics.

---

## 2. Iteration Flow

### Step 1: Definition & PRD Alignment
Before editing any files:
- Clarify the user goal.
- Record the feature and tasks in a new version of the markdown sprint PRD (e.g. `prds/md/sprint06-prd-260525-v0.1.md`).
- Detail the exact task steps in the json PRD (`prds/json/sprint06-prd-260525-v0.1.json`).

### Step 2: Build the First Screen
- Set up a clean, high-aesthetic mock UI in React.
- Import standard Lucide icons and style harmoniously using CSS tokens.
- **Goal**: Make the interface feel responsive, polished, and alive before binding real endpoints.

### Step 3: Wire the API & State
- Add backend routes in `backend/src/app.ts`.
- Wrap API requests using unified clients in `src/services/apiClient.ts` (never use ad-hoc `fetch` inside JSX components).
- Bind states to frontend components defensively to prevent UI screen freeze or blank states.

### Step 4: Step-Commit
- **Always stage and commit** locally upon completing each distinct sub-task/feature. Keep commits small and atomic.

---

## 3. Review & Testing Gates

Before marking any prototype task as "Done":
1. Run `npm run lint` to catch hidden TypeScript discrepancies.
2. Run `npm run build` to verify the bundling processes pass cleanly.
3. Run the regression smoke test suite to guarantee zero regression on preexisting authentication or courseware pathways.
