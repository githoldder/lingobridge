# E2E Smoke Report

## Environment

- Frontend URL: http://127.0.0.1:4174
- Backend URL: http://127.0.0.1:3001/api/v1
- Browser: Chromium (headed, fake media stream)
- Date: 2026-05-15

## Results

| Step | Result | Notes |
|---|---|---|
| R015 Frontend open | Pass |  |
| R016 Login page visible | Pass |  |
| R017 Teacher login | Pass |  |
| R018 Teacher courses page | Pass |  |
| R019 Create E2E course | Pass |  |
| R020 PDF upload | Pass |  |
| R021 XLSX upload | Pass |  |
| R022 Enter teacher classroom | Pass |  |
| R023 Camera start | Pass |  |
| R025 Mic unmute | Pass |  |
| R026 Teacher recording upload | Pass |  |
| R024 Camera stop | Pass |  |
| R025 Mic mute | Pass |  |
| R027 Camera indicator | Blocked | browser_pending_manual - requires real camera to verify OS indicator closes |
| R028 Student login | Pass |  |
| R029 Student classroom page | Pass |  |
| R030 Page flip | Pass |  |
| R031 TTS | Pass |  |
| R032 Student recording upload | Pass |  |
| R033 Recording play | Pass |  |
| R034 Recording download | Pass |  |
| R035 Recording delete | Pass |  |
| R036 Schedule replay visible | Pass |  |

## Blocking Defects

None

## Non-Blocking Notes

- R027 Camera indicator: browser_pending_manual - requires real camera to verify OS indicator closes

## Screenshots

Screenshots saved to `output/playwright/screenshots/`