# T24 Live Route Guard Report

## Summary

**Gate: FAIL** — see individual results

## Results

| Test | Result |
|---|---|
| T1a Student enters #classroom-view | Pass |
| T1b No Practice mode text in live route | Pass |
| T2a Recording hidden for student | Pass |
| T2b Screen share hidden for student | Pass |
| T2c Raise hand visible for student | Pass |
| Test 3 teacher controls | Fail: locator.click: Target page, context or browser has been closed
Call log:
[2m  - waiting for locator('#sidebar-footer button:has-text("Login")')[22m
 |
| T4a student-classroom routing | Fail: Could not verify route uses shared classroom |
| T4b StudentClassroomView is practice-only (has "Practice mode") | Pass |

## Details

### Test 1: Student live entry
- Navigates to frontend, logs in as student, clicks Join Classroom
- Verifies `#classroom-view` element is rendered (shared live classroom component)
- Verifies "Practice mode" text is **absent** (ensuring old StudentClassroomView is not the live route)

### Test 2: Student role hides teacher-only controls
- Recording button absent
- Screen share absent
- Raise hand present (student-only control)

### Test 3: Teacher role shows teacher controls
- Recording button present
- Screen share present

### Test 4: Code structure
- `student-classroom` route renders `TeacherClassroomView role="student"`
- `StudentClassroomView` contains practice-only indicators, not used for live routing

## Proof

Screenshots saved to `output/playwright/screenshots/t24-*.png`
