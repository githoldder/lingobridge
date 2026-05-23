-- S4-T05: LingoBridge seed data
-- Safe to re-run: all INSERTs use ON CONFLICT DO NOTHING

-- ─── Users ───
-- password_hash = plain text for dev (TODO: migrate to bcrypt)
INSERT INTO users (id, username, email, password_hash, role, display_name, language_pref, status)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@test.com', 'admin@test.com', 'Test@123456', 'admin', '系统管理员', 'zh', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (id, username, email, password_hash, role, display_name, language_pref, status)
VALUES
  ('a0000000-0000-0000-0000-000000000002', 'teacher@test.com', 'teacher@test.com', 'Test@123456', 'teacher', '王老师', 'zh', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (id, username, email, password_hash, role, display_name, language_pref, status)
VALUES
  ('a0000000-0000-0000-0000-000000000003', 'student_a@test.com', 'student_a@test.com', 'Test@123456', 'student', '阿合买提', 'kk', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (id, username, email, password_hash, role, display_name, language_pref, status)
VALUES
  ('a0000000-0000-0000-0000-000000000004', 'student_b@test.com', 'student_b@test.com', 'Test@123456', 'student', '玛丽亚', 'ru', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (id, username, email, password_hash, role, display_name, language_pref, status)
VALUES
  ('a0000000-0000-0000-0000-000000000005', 'student_c@test.com', 'student_c@test.com', 'Test@123456', 'student', '努尔兰', 'kk', 'active')
ON CONFLICT (username) DO NOTHING;

-- ─── Student Profiles ───
INSERT INTO student_profiles (user_id, student_no, class_name, nationality, native_language)
VALUES
  ('a0000000-0000-0000-0000-000000000003', '2024001', '文科院中文测试班', '哈萨克斯坦', 'kk')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student_profiles (user_id, student_no, class_name, nationality, native_language)
VALUES
  ('a0000000-0000-0000-0000-000000000004', '2024002', '文科院中文测试班', '俄罗斯', 'ru')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student_profiles (user_id, student_no, class_name, nationality, native_language)
VALUES
  ('a0000000-0000-0000-0000-000000000005', '2024003', '文科院中文测试班', '哈萨克斯坦', 'kk')
ON CONFLICT (user_id) DO NOTHING;

-- ─── Teacher-Student Links (Legacy) ───
INSERT INTO teacher_student_links (teacher_id, student_id, class_name, status)
VALUES
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', '文科院中文测试班', 'active')
ON CONFLICT (teacher_id, student_id) DO NOTHING;

INSERT INTO teacher_student_links (teacher_id, student_id, class_name, status)
VALUES
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '文科院中文测试班', 'active')
ON CONFLICT (teacher_id, student_id) DO NOTHING;

INSERT INTO teacher_student_links (teacher_id, student_id, class_name, status)
VALUES
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', '文科院中文测试班', 'active')
ON CONFLICT (teacher_id, student_id) DO NOTHING;

-- ─── Classes (New Model) ───
INSERT INTO classes (id, teacher_id, name, description)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '文科院中文测试班', 'Demo class for testing')
ON CONFLICT (id) DO NOTHING;

-- ─── Class Members ───
INSERT INTO class_members (class_id, student_id)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (class_id, student_id) DO NOTHING;

INSERT INTO class_members (class_id, student_id)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT (class_id, student_id) DO NOTHING;

INSERT INTO class_members (class_id, student_id)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005')
ON CONFLICT (class_id, student_id) DO NOTHING;


-- ─── Demo Course ───
INSERT INTO courses (id, teacher_id, class_id, title, description, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '第三课：自我介绍', 'MVP demo course generated from teacher courseware.', 'published')
ON CONFLICT (id) DO NOTHING;

-- ─── Course Members ───
INSERT INTO course_members (course_id, user_id, role)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'student')
ON CONFLICT (course_id, user_id) DO NOTHING;

INSERT INTO course_members (course_id, user_id, role)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'student')
ON CONFLICT (course_id, user_id) DO NOTHING;

INSERT INTO course_members (course_id, user_id, role)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'student')
ON CONFLICT (course_id, user_id) DO NOTHING;

-- ─── Demo Lesson Node ───
INSERT INTO lesson_nodes (id, course_id, title, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '自我介绍', 'draft')
ON CONFLICT (id) DO NOTHING;

-- ─── Demo Assignment Node ───
INSERT INTO assignment_nodes (course_id, lesson_node_id, title, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '自我介绍作业', 'draft')
ON CONFLICT (lesson_node_id) DO NOTHING;
