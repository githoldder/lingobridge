# LingoBridge Template Samples

This directory contains sample template files for demonstrating LingoBridge features.

## Directory Structure

```
samples/
├── pptx/
│   └── 拼音1-Lesson1.pptx    — Sample courseware: Pinyin Lesson 1 (copy from analysis/data-analysis/)
├── pdf/
│   └── Lesson1-Hello.pdf     — Sample PDF: Chinese Lesson 1 with greetings vocabulary
├── images/
│   ├── teacher-avatar.svg    — Sample teacher avatar (blue circle)
│   ├── student-avatar.svg    — Sample student avatar (green circle)
│   ├── course-cover.svg      — Sample course cover image
│   └── logo-badge.svg        — Sample logo badge
└── excel/
    └── PINYIN-01-Lesson1-2.xlsx — Sample homework Excel with pronunciation + vocabulary tasks
```

## Excel Format

The Excel follows `homework_excel_schema` from `prds/prd.json`:
- **Required columns**: course_code, unit, lesson, task_id, task_type, zh_text, pinyin, translation_ru, translation_kk, publish_to_homework, publish_to_vocab
- **Task types**: pronunciation, vocabulary, sentence_reading
- **publish_to_homework**: TRUE = appears in student homework path
- **publish_to_vocab**: TRUE = appears in vocabulary self-study bank

## Usage

1. Upload `.pptx` or `.pdf` files via Teacher Courses → Upload Courseware
2. Upload `.xlsx` files via Teacher Courses → Upload Homework Excel
3. Students access generated content via Homework and Vocabulary views
