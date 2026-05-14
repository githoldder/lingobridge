# Frontend Worker Prompt

Use `prds/prd.md` and `prds/prd.json` as the execution contract. Replace mock behavior only on demo-critical pages: login, teacher courseware upload, student course practice/TTS/recordings, teacher live/replay, and schedule replay history.

Preserve the current visual style. Fix camera/mic/screen lifecycle so all tracks stop on toggle off, exit, unmount, and recording stop.

Do not move the current Vite frontend into `frontend/` unless the task explicitly includes build/Vercel migration.

