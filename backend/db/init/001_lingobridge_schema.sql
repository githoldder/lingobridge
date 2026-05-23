CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'disabled', 'invited', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lesson_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE file_kind AS ENUM ('pdf', 'pptx', 'xlsx', 'audio', 'video', 'image', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE render_status AS ENUM ('pending', 'processing', 'ready', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE live_session_status AS ENUM ('scheduled', 'active', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE learning_context AS ENUM ('homework', 'vocabulary', 'practice', 'live');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE learning_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username citext NOT NULL UNIQUE,
  email citext UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL,
  display_name text NOT NULL,
  language_pref text NOT NULL DEFAULT 'zh',
  status account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_or_username CHECK (email IS NOT NULL OR username IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm ON users USING gin (display_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS teacher_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title text,
  department text,
  office text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_no citext UNIQUE,
  class_name text,
  nationality text,
  native_language text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_class ON student_profiles(class_name);

CREATE TABLE IF NOT EXISTS teacher_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_name text,
  status account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_student_distinct CHECK (teacher_id <> student_id),
  CONSTRAINT teacher_student_unique UNIQUE (teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_student_teacher ON teacher_student_links(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_teacher_student_student ON teacher_student_links(student_id, status);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

CREATE TABLE IF NOT EXISTS class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  CONSTRAINT class_members_unique UNIQUE (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members(class_id, removed_at);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id, removed_at);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status course_status NOT NULL DEFAULT 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  default_courseware_file_id uuid, -- Cannot add foreign key yet as files table is created later
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_time_order CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher_status ON courses(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_title ON courses USING gin (title gin_trgm_ops);

CREATE TABLE IF NOT EXISTS course_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher', 'student', 'assistant')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  CONSTRAINT course_members_unique UNIQUE (course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_members_user ON course_members(user_id, removed_at);
CREATE INDEX IF NOT EXISTS idx_course_members_course_role ON course_members(course_id, role, removed_at);

CREATE TABLE IF NOT EXISTS lesson_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  style_seed integer NOT NULL DEFAULT floor(random() * 1000000),
  color_token text NOT NULL DEFAULT 'blue',
  shape_token text NOT NULL DEFAULT 'circle',
  status lesson_status NOT NULL DEFAULT 'draft',
  default_courseware_file_id uuid, -- Foreign key added at the end
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_nodes_time_order CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_lesson_nodes_course_status ON lesson_nodes(course_id, status, starts_at);

CREATE TABLE IF NOT EXISTS assignment_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid NOT NULL UNIQUE REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz,
  status assignment_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_nodes_course ON assignment_nodes(course_id, status, due_at);

CREATE TABLE IF NOT EXISTS live_class_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_node_id uuid NOT NULL REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'course_member' CHECK (source IN ('course_member', 'manual')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  CONSTRAINT live_class_students_unique UNIQUE (lesson_node_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_live_class_students_student ON live_class_students(student_id, removed_at);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE SET NULL,
  kind file_kind NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  storage_url text NOT NULL,
  checksum_sha256 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_course_lesson ON files(course_id, lesson_node_id, kind);
CREATE INDEX IF NOT EXISTS idx_files_owner_created ON files(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS courseware_files (
  id uuid PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE SET NULL,
  kind file_kind NOT NULL CHECK (kind IN ('pdf', 'pptx')),
  render_status render_status NOT NULL DEFAULT 'pending',
  page_count integer NOT NULL DEFAULT 0 CHECK (page_count >= 0),
  render_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courseware_lesson_status ON courseware_files(lesson_node_id, render_status);

CREATE TABLE IF NOT EXISTS course_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courseware_file_id uuid REFERENCES courseware_files(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE SET NULL,
  page_number integer NOT NULL CHECK (page_number > 0),
  content_html text,
  audio_text text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_pages_unique UNIQUE (courseware_file_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_course_pages_course_page ON course_pages(course_id, page_number);

CREATE TABLE IF NOT EXISTS assignment_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE SET NULL,
  assignment_node_id uuid REFERENCES assignment_nodes(id) ON DELETE SET NULL,
  file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  source_mode text NOT NULL CHECK (source_mode IN ('xlsx_import', 'manual_form')),
  filename text,
  tasks_count integer NOT NULL DEFAULT 0 CHECK (tasks_count >= 0),
  vocab_count integer NOT NULL DEFAULT 0 CHECK (vocab_count >= 0),
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_imports_lesson ON assignment_imports(lesson_node_id, created_at DESC);

CREATE TABLE IF NOT EXISTS learning_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  assignment_node_id uuid REFERENCES assignment_nodes(id) ON DELETE CASCADE,
  source_import_id uuid REFERENCES assignment_imports(id) ON DELETE SET NULL,
  task_key text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('pronunciation', 'vocabulary', 'sentence_reading', 'dialogue', 'listening')),
  unit integer NOT NULL DEFAULT 1,
  lesson integer NOT NULL DEFAULT 1,
  lesson_title text NOT NULL DEFAULT '',
  page_number integer NOT NULL DEFAULT 1 CHECK (page_number > 0),
  zh_text text NOT NULL,
  pinyin text NOT NULL DEFAULT '',
  translation_ru text NOT NULL DEFAULT '',
  translation_kk text NOT NULL DEFAULT '',
  prompt text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  initial text NOT NULL DEFAULT '',
  final text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT '',
  rhyme_group text NOT NULL DEFAULT '',
  difficulty integer NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  due_at timestamptz,
  publish_to_homework boolean NOT NULL DEFAULT true,
  publish_to_vocab boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learning_tasks_unique UNIQUE (course_id, lesson_node_id, task_key)
);

CREATE INDEX IF NOT EXISTS idx_learning_tasks_assignment ON learning_tasks(assignment_node_id, publish_to_homework, sort_order);
CREATE INDEX IF NOT EXISTS idx_learning_tasks_lesson ON learning_tasks(lesson_node_id, sort_order);

CREATE TABLE IF NOT EXISTS vocabulary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  task_id uuid REFERENCES learning_tasks(id) ON DELETE SET NULL,
  zh_text text NOT NULL,
  pinyin text NOT NULL DEFAULT '',
  translation_ru text NOT NULL DEFAULT '',
  translation_kk text NOT NULL DEFAULT '',
  initial text NOT NULL DEFAULT '',
  final text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT '',
  rhyme_group text NOT NULL DEFAULT '',
  difficulty integer NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  tags text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_course_lesson ON vocabulary_items(course_id, lesson_node_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_search ON vocabulary_items USING gin ((zh_text || ' ' || pinyin) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS learning_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  assignment_node_id uuid REFERENCES assignment_nodes(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES learning_tasks(id) ON DELETE CASCADE,
  context learning_context NOT NULL,
  status learning_status NOT NULL DEFAULT 'not_started',
  score numeric(5,2) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  attempts_count integer NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  last_recording_id uuid,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learning_records_unique UNIQUE (student_id, lesson_node_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_records_student_lesson ON learning_records(student_id, lesson_node_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_records_task ON learning_records(task_id);

CREATE TABLE IF NOT EXISTS homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid NOT NULL REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  assignment_node_id uuid NOT NULL REFERENCES assignment_nodes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded')),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  draft_data jsonb DEFAULT '{}',
  CONSTRAINT homework_submissions_unique UNIQUE (student_id, assignment_node_id)
);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_student_course ON homework_submissions(student_id, course_id);

CREATE TABLE IF NOT EXISTS homework_recording_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_node_id uuid NOT NULL REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES learning_tasks(id) ON DELETE CASCADE,
  slot_index integer NOT NULL CHECK (slot_index BETWEEN 1 AND 3),
  audio_url text NOT NULL,
  local_cache_key text,
  score_status text NOT NULL DEFAULT 'pending',
  score_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homework_recording_attempts_unique UNIQUE (student_id, task_id, slot_index)
);
CREATE INDEX IF NOT EXISTS idx_homework_recording_attempts_student_task ON homework_recording_attempts(student_id, task_id);

CREATE TABLE IF NOT EXISTS vocabulary_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES learning_tasks(id) ON DELETE CASCADE,
  mastery_step numeric(3,2) NOT NULL DEFAULT 0.00,
  review_count integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamptz,
  decay_state numeric(3,2) NOT NULL DEFAULT 1.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vocabulary_progress_unique UNIQUE (student_id, task_id)
);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_student ON vocabulary_progress(student_id);

CREATE TABLE IF NOT EXISTS recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_node_id uuid REFERENCES lesson_nodes(id) ON DELETE SET NULL,
  task_id uuid REFERENCES learning_tasks(id) ON DELETE SET NULL,
  page_number integer NOT NULL DEFAULT 1 CHECK (page_number > 0),
  audio_url text NOT NULL,
  filename text NOT NULL,
  duration_sec integer NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE learning_records
    ADD CONSTRAINT learning_records_last_recording_fk
    FOREIGN KEY (last_recording_id) REFERENCES recordings(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_recordings_student_task ON recordings(student_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_course_lesson ON recordings(course_id, lesson_node_id, page_number);

CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  lesson_node_id uuid NOT NULL REFERENCES lesson_nodes(id) ON DELETE CASCADE,
  status live_session_status NOT NULL DEFAULT 'scheduled',
  source_mode text NOT NULL DEFAULT 'pdf' CHECK (source_mode IN ('screen', 'pdf', 'pptx', 'external_meeting')),
  current_page integer NOT NULL DEFAULT 1 CHECK (current_page > 0),
  recording_status text NOT NULL DEFAULT 'idle' CHECK (recording_status IN ('idle', 'recording', 'saved', 'failed')),
  meeting_url text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_sessions_time_order CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at > started_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_live_sessions_one_active_per_lesson
  ON live_sessions(lesson_node_id)
  WHERE status IN ('scheduled', 'active');
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_status ON live_sessions(course_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS lecture_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id uuid REFERENCES live_sessions(id) ON DELETE SET NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title text NOT NULL,
  video_url text NOT NULL,
  filename text NOT NULL,
  duration_sec integer NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lecture_recordings_course ON lecture_recordings(course_id, created_at DESC);

CREATE TABLE IF NOT EXISTS classroom_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classroom_comments_session ON classroom_comments(live_session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  speaker_id uuid REFERENCES users(id) ON DELETE SET NULL,
  start_ms integer NOT NULL CHECK (start_ms >= 0),
  end_ms integer NOT NULL CHECK (end_ms >= start_ms),
  zh_text text NOT NULL DEFAULT '',
  translation_ru text NOT NULL DEFAULT '',
  translation_kk text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcript_segments_session_time ON transcript_segments(live_session_id, start_ms);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);

DO $$ BEGIN
  ALTER TABLE courses
    ADD CONSTRAINT courses_default_courseware_fk
    FOREIGN KEY (default_courseware_file_id) REFERENCES files(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE lesson_nodes
    ADD CONSTRAINT lesson_nodes_default_courseware_fk
    FOREIGN KEY (default_courseware_file_id) REFERENCES files(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migration: ensure homework_submissions has draft_data column (for DBs created before the column was added)
DO $$ BEGIN
  ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS draft_data jsonb DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
