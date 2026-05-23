# Frontend Worker Prompt

Use `prds/prd.md` for navigation, then read the active sprint file under `prds/sprints/`. Use `prds/prd.json` only when the task explicitly needs the legacy machine-readable package. Replace mock behavior only on demo-critical pages: login, teacher courseware upload, student course practice/TTS/recordings, teacher live/replay, and schedule replay history.

Preserve the current visual style. Fix camera/mic/screen lifecycle so all tracks stop on toggle off, exit, unmount, and recording stop.

Do not move the current Vite frontend into `frontend/` unless the task explicitly includes build/Vercel migration.
