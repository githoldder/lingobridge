# Project Brief

## Product

LingoBridge is a Chinese learning website for Kazakhstani international students. The first MVP helps students follow teacher-uploaded PPT/PDF courseware and practice pronunciation after class.

## MVP Core Loop

```text
Teacher uploads PPT/PDF -> system generates course pages
-> student opens course practice -> clicks Chinese TTS
-> records local pronunciation -> uploads recording
-> plays/deletes/downloads own recordings
```

## Immediate Delivery Goal

Prepare the project for the first MVP demo/public test on 2026-05-15. The demo must support teacher/student data entry and project demo video recording.

## Current Repo State

- Vite/React frontend prototype lives at repository root.
- No backend exists yet.
- Several demo-critical paths are still mock-only.
- `prds/prd.md` and `prds/prd.json` define the current execution contract.

## Critical Requirements

- Teacher upload: `.pptx`, `.pdf`, `.xlsx`.
- Student practice: course page navigation, TTS, MediaRecorder audio capture.
- Recording management: upload, list, play, download, delete.
- Teacher replay: screen/camera recording saved and visible to students by date.
- Live modes: local screen share and PDF/canvas mode.
- Bugfix: camera/mic/screen tracks must stop on toggle off, exit, and unmount.
- UI languages: Chinese, Russian, Kazakh.

## Non-Goals

- Online PPT editing.
- Real-time bilingual subtitles.
- Bullet comments/social features.
- Multi-tenant SaaS.
- AI pronunciation scoring.
- International payment.

