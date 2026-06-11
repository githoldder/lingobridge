import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as XLSX from 'xlsx';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const SOURCE_PDF = resolve(ROOT, 'tests/samples/pdf/拼音1-Lesson1.pdf');
const OUTPUT_DIR = resolve(ROOT, 'tests/samples/generated/pinyin-demo');
const BASE_URL = getArg('--base-url') || process.env.LINGOBRIDGE_BASE_URL || 'https://lingobridge-lake.vercel.app';
const API_BASE = `${BASE_URL.replace(/\/$/, '')}/api/v1`;
const TEACHER_EMAIL = process.env.LINGOBRIDGE_TEACHER_EMAIL || 'teacher@test.com';
const TEACHER_PASSWORD = process.env.LINGOBRIDGE_TEACHER_PASSWORD || process.env.LINGOBRIDGE_DEMO_PASSWORD || 'Test@123456';
const STUDENT_EMAIL = process.env.LINGOBRIDGE_STUDENT_EMAIL || 'student_a@test.com';
const GENERATE_ONLY = process.argv.includes('--generate-only');

const lessons = [
  {
    no: 1,
    title: '拼音1 第一课：声母 b p m f',
    description: '三页小课件：认识 b p m f，练习基础声母与问候表达。',
    pages: [0, 1, 2],
    rows: [
      task('P1-L1-001', 1, 'pronunciation', '爸爸', 'bà ba', 'папа', 'әке', 1, 'b', 'a', '4-轻', 'family'),
      task('P1-L1-002', 1, 'pronunciation', '妈妈', 'mā ma', 'мама', 'ана', 1, 'm', 'a', '1-轻', 'family'),
      task('P1-L1-003', 1, 'sentence_reading', '爸爸妈妈好。', 'bà ba mā ma hǎo.', 'Здравствуйте, папа и мама.', 'Әке, ана, сәлеметсіздер ме.', 2, 'h', 'ao', '3', 'greeting'),
      task('P1-L1-004', 1, 'vocabulary', '你好', 'nǐ hǎo', 'здравствуйте', 'сәлеметсіз бе', 3, 'n', 'i', '3', 'greeting'),
    ],
  },
  {
    no: 2,
    title: '拼音1 第二课：声母 d t n l',
    description: '三页小课件：d t n l 发音对比，练习课堂常用短句。',
    pages: [5, 6, 7],
    rows: [
      task('P1-L2-001', 2, 'pronunciation', '大', 'dà', 'большой', 'үлкен', 1, 'd', 'a', '4', 'adjective'),
      task('P1-L2-002', 2, 'pronunciation', '他', 'tā', 'он', 'ол', 1, 't', 'a', '1', 'pronoun'),
      task('P1-L2-003', 2, 'sentence_reading', '老师好。', 'lǎo shī hǎo.', 'Здравствуйте, учитель.', 'Мұғалім, сәлеметсіз бе.', 2, 'l', 'ao', '3', 'classroom'),
      task('P1-L2-004', 2, 'dialogue', '你来读。', 'nǐ lái dú.', 'Прочитай, пожалуйста.', 'Сен оқы.', 3, 'n', 'i', '3', 'classroom'),
    ],
  },
  {
    no: 3,
    title: '拼音1 第三课：声母 g k h',
    description: '三页小课件：g k h 发音练习，过渡到自我介绍。',
    pages: [12, 13, 17],
    rows: [
      task('P1-L3-001', 3, 'pronunciation', '哥哥', 'gē ge', 'старший брат', 'аға', 1, 'g', 'e', '1-轻', 'family'),
      task('P1-L3-002', 3, 'pronunciation', '口', 'kǒu', 'рот', 'ауыз', 1, 'k', 'ou', '3', 'body'),
      task('P1-L3-003', 3, 'sentence_reading', '我叫阿合买提。', 'wǒ jiào ā hé mǎi tí.', 'Меня зовут Ахмети.', 'Менің атым Ахмети.', 2, 'w', 'o', '3', 'intro'),
      task('P1-L3-004', 3, 'vocabulary', '中文', 'zhōng wén', 'китайский язык', 'қытай тілі', 3, 'zh', 'ong', '1', 'language'),
    ],
  },
];

function getArg(name) {
  const item = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : '';
}

function task(taskId, lesson, taskType, zhText, pinyin, translationRu, translationKk, pageNumber, initial, final, tone, tags) {
  return {
    course_code: 'PINYIN-01',
    unit: 1,
    lesson,
    lesson_title: `拼音1 第${lesson}课`,
    task_id: taskId,
    task_type: taskType,
    page_number: pageNumber,
    zh_text: zhText,
    pinyin,
    translation_ru: translationRu,
    translation_kk: translationKk,
    prompt: taskType === 'vocabulary' ? '听音辨义，并跟读三遍。' : '请跟老师读，并录音提交。',
    answer: zhText,
    initial,
    final,
    tone,
    rhyme_group: final,
    difficulty: pageNumber,
    tags,
    publish_to_homework: true,
    publish_to_vocab: taskType === 'vocabulary' || taskType === 'pronunciation',
    sort_order: Number(taskId.split('-').at(-1)),
  };
}

function ensureAssets() {
  if (!existsSync(SOURCE_PDF)) throw new Error(`Source PDF not found: ${SOURCE_PDF}`);
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const extract = spawnSync('python3', ['-c', `
from pathlib import Path
from pypdf import PdfReader, PdfWriter
source = Path(r'''${SOURCE_PDF}''')
out = Path(r'''${OUTPUT_DIR}''')
lessons = ${JSON.stringify(lessons.map((l) => ({ no: l.no, pages: l.pages })))}
reader = PdfReader(str(source))
for lesson in lessons:
    writer = PdfWriter()
    for idx in lesson["pages"]:
        writer.add_page(reader.pages[idx])
    target = out / f"pinyin-lesson-{lesson['no']:02d}.pdf"
    with target.open("wb") as f:
        writer.write(f)
print("ok")
`], { encoding: 'utf8' });
  if (extract.status !== 0) {
    throw new Error(`Failed to extract lesson PDFs. Install pypdf if needed.\n${extract.stderr || extract.stdout}`);
  }

  for (const lesson of lessons) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(lesson.rows);
    ws['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 16 }, { wch: 18 },
      { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 26 },
      { wch: 26 }, { wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 18 },
      { wch: 18 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, `Lesson ${lesson.no}`);
    XLSX.writeFile(wb, resolve(OUTPUT_DIR, `pinyin-lesson-${String(lesson.no).padStart(2, '0')}.xlsx`));
  }
}

async function api(path, options = {}, token = '') {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch {}
  if (!response.ok || body?.code !== 0) {
    throw new Error(`${path} failed: ${response.status} ${body?.message || text.slice(0, 200)}`);
  }
  return body.data;
}

async function login() {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEACHER_EMAIL, password: TEACHER_PASSWORD }),
  });
  return data.token;
}

async function uploadFile(path, fields, token) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append('file', new Blob([readFileSync(path)]), basename(path));
  try {
    return await api('/coursewares', { method: 'POST', body: form }, token);
  } catch (error) {
    console.warn(`[upload] multipart failed for ${basename(path)}; retrying JSON/base64: ${error.message}`);
    const filename = basename(path);
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return api('/coursewares', {
      method: 'POST',
      body: JSON.stringify({
        ...fields,
        filename,
        mimeType,
        base64: readFileSync(path).toString('base64'),
      }),
    }, token);
  }
}

async function seed() {
  const token = await login();
  const existingCourses = await api('/courses', {}, token);

  for (const lesson of lessons) {
    let course = existingCourses.find((item) => item.title === lesson.title);
    if (!course) {
      course = await api('/courses', {
        method: 'POST',
        body: JSON.stringify({ title: lesson.title, description: lesson.description }),
      }, token);
      existingCourses.push(course);
      console.log(`[course] created ${course.title}`);
    } else {
      console.log(`[course] reuse ${course.title}`);
    }

    try {
      await api(`/courses/${course.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ q: STUDENT_EMAIL }),
      }, token);
      console.log(`[member] ${STUDENT_EMAIL} enrolled`);
    } catch (error) {
      console.log(`[member] skipped: ${error.message}`);
    }

    const nodes = await api(`/courses/${course.id}/lesson-nodes`, {}, token);
    let node = nodes.find((item) => item.title === lesson.title);
    if (!node) {
      const created = await api(`/courses/${course.id}/lesson-nodes`, {
        method: 'POST',
        body: JSON.stringify({ title: lesson.title, status: 'scheduled' }),
      }, token);
      node = created.lessonNode;
      console.log(`[lesson] created ${node.title}`);
    } else {
      console.log(`[lesson] reuse ${node.title}`);
    }

    const pdfPath = resolve(OUTPUT_DIR, `pinyin-lesson-${String(lesson.no).padStart(2, '0')}.pdf`);
    const xlsxPath = resolve(OUTPUT_DIR, `pinyin-lesson-${String(lesson.no).padStart(2, '0')}.xlsx`);
    const pdfResult = await uploadFile(pdfPath, { courseId: course.id, lessonNodeId: node.id }, token);
    const fileId = pdfResult.file?.id;
    if (fileId) {
      await api(`/lesson-nodes/${node.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ defaultCoursewareFileId: fileId, status: 'scheduled' }),
      }, token);
    }
    console.log(`[pdf] uploaded ${basename(pdfPath)} pages=${pdfResult.pages?.length ?? 0}`);

    const xlsxResult = await uploadFile(xlsxPath, { courseId: course.id, lessonNodeId: node.id }, token);
    console.log(`[xlsx] uploaded ${basename(xlsxPath)} tasks=${xlsxResult.tasks?.length ?? 0} vocab=${xlsxResult.vocabulary?.length ?? 0}`);
  }
}

async function main() {
  ensureAssets();
  console.log(`[assets] generated in ${OUTPUT_DIR}`);
  if (GENERATE_ONLY) return;
  await seed();
  console.log('[done] pinyin demo data seeded persistently through API');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
