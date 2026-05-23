import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  Users,
  UploadCloud,
  Clock,
  BookOpen,
  FileSpreadsheet,
  Video,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Loader2,
  FileText,
  Play,
  Download,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  coursesApi,
  liveSessionsApi,
  courseMembersApi,
  coursewareFilesApi,
  assignmentsApi,
  homeworkApi,
  lessonNodesApi,
  fileToBase64,
  type Course,
} from '../services/apiClient.ts';
import { styleFromSeed } from '../utils/styleFromSeed.ts';

interface LessonNode {
  id: string;
  courseId: string;
  title: string;
  startsAt?: string;
  endsAt?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  styleSeed: number;
}

interface CourseMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;
}

interface CoursewareFile {
  id: string;
  filename: string;
  mimeType: string;
  type?: string;
  lessonNodeId?: string;
  liveClassTitle?: string;
  pageCount: number;
  status: 'processing' | 'ready' | 'error';
  createdAt: string;
}

interface HomeworkImportResult {
  tasksCount: number;
  vocabCount: number;
  warnings: string[];
  errorRows: string[];
}

interface LiveSession {
  id: string;
  title: string;
  status: 'active' | 'ended';
  startedAt: string;
  recordingUrl?: string;
  lessonNodeId?: string;
}

type TabKey = 'info' | 'students' | 'schedule' | 'courseware' | 'homework' | 'live';

interface TeacherCourseDetailViewProps {
  courseId: string;
  onNavigate?: (target: string) => void;
  onBack?: () => void;
  onEnterLive?: (courseId: string, lessonNodeId: string) => void;
}

const TABS: { key: TabKey; icon: React.ReactNode }[] = [
  { key: 'info', icon: <BookOpen size={16} /> },
  { key: 'students', icon: <Users size={16} /> },
  { key: 'schedule', icon: <Clock size={16} /> },
  { key: 'courseware', icon: <UploadCloud size={16} /> },
  { key: 'homework', icon: <FileSpreadsheet size={16} /> },
  { key: 'live', icon: <Video size={16} /> },
];

const ShapeIcon: React.FC<{ shape: string; size?: number; color?: string }> = ({ shape, size = 20, color = 'currentColor' }) => {
  switch (shape) {
    case 'circle':
      return <div style={{ width: size, height: size, borderRadius: '50%', background: color }} />;
    case 'square':
      return <div style={{ width: size, height: size, borderRadius: 4, background: color }} />;
    case 'diamond':
      return <div style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, borderRadius: 3 }} />;
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <polygon points="10,2 18,18 2,18" fill={color} />
        </svg>
      );
    case 'hexagon':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5" fill={color} />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <polygon points="10,1 12.5,7.5 19,7.5 14,12 16,18.5 10,14.5 4,18.5 6,12 1,7.5 7.5,7.5" fill={color} />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <polygon points="7,1 13,1 13,7 19,7 19,13 13,13 13,19 7,19 7,13 1,13 1,7 7,7" fill={color} />
        </svg>
      );
    case 'pentagon':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <polygon points="10,1 19,7 16,18 4,18 1,7" fill={color} />
        </svg>
      );
    default:
      return <div style={{ width: size, height: size, borderRadius: '50%', background: color }} />;
  }
};

export default function TeacherCourseDetailView({ courseId, onNavigate, onBack, onEnterLive }: TeacherCourseDetailViewProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const all = await coursesApi.list();
      const found = all.find(c => c.id === courseId);
      if (found) setCourse(found);
    } catch (e: any) {
      setError(e.message || t('course.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400 font-bold">{t('course.loading')}</div>
    );
  }

  if (error || !course) {
    return (
      <div className="py-20 text-center">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <p className="text-gray-500 font-bold">{error || t('course.load_failed')}</p>
        <button onClick={onBack} className="mt-4 text-[#0056D2] font-bold text-sm hover:underline">
          {t('course.reports')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack || (() => onNavigate?.('teacher-courses'))}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{course.title}</h1>
          <p className="text-sm text-gray-400 font-medium">{course.description || t('course.no_description')}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
          course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {course.status === 'published' ? t('course.published') : t('course.draft')}
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-[#0056D2] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {t(`course_detail.tab_${tab.key}`)}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'info' && <CourseInfoTab course={course} onSave={loadCourse} t={t} />}
        {activeTab === 'students' && <StudentsTab courseId={courseId} t={t} />}
        {activeTab === 'courseware' && <CoursewareTab courseId={courseId} t={t} />}
        {activeTab === 'schedule' && <ScheduleTab courseId={courseId} t={t} />}
        {activeTab === 'homework' && <HomeworkTab courseId={courseId} t={t} />}
        {activeTab === 'live' && <LiveTab courseId={courseId} t={t} onEnterLive={onEnterLive} />}
      </motion.div>
    </div>
  );
}

function LiveClassSelect({
  courseId,
  t,
  value,
  onChange,
}: {
  courseId: string;
  t: (k: string) => string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [nodes, setNodes] = useState<LessonNode[]>([]);

  useEffect(() => {
    let active = true;
    lessonNodesApi.list(courseId)
      .then((data) => {
        if (!active) return;
        setNodes(data || []);
        if (!value && data?.length) onChange(data[0].id);
      })
      .catch(() => active && setNodes([]));
    return () => { active = false; };
  }, [courseId]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <label className="block text-sm font-extrabold text-gray-800 mb-2">{t('live_class.select')}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-[#0056D2]"
      >
        <option value="">{t('live_class.select_empty')}</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>{node.title}</option>
        ))}
      </select>
      <p className="mt-2 text-xs font-medium text-gray-500">{t('live_class.relationship_hint')}</p>
    </div>
  );
}

function CourseInfoTab({ course, onSave, t }: { course: Course; onSave: () => void; t: (k: string) => string }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [status, setStatus] = useState(course.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await coursesApi.update(course.id, { title, description, status });
      setMessage(t('course_info.saved'));
      onSave();
    } catch (e: any) {
      setMessage(e.message || t('course_info.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <h2 className="text-lg font-extrabold text-gray-900">{t('course_info.title')}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">{t('course_info.course_title')}</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-blue-50"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">{t('course_info.description')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-blue-50 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">{t('course_info.status')}</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as 'published' | 'draft')}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2]"
          >
            <option value="published">{t('course.published')}</option>
            <option value="draft">{t('course.draft')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">{t('course_info.cover_image')}</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center border border-gray-200">
              <BookOpen size={32} className="text-[#0056D2]" />
            </div>
            <label className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
              {t('course_info.upload_cover')}
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {message && (
        <div className={`text-sm font-bold px-4 py-2 rounded-xl ${
          message.includes('failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#0056D2] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {t('course_info.save')}
      </button>
    </div>
  );
}

function StudentsTab({ courseId, t }: { courseId: string; t: (k: string) => string }) {
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [candidates, setCandidates] = useState<Array<{ id: string; username: string; displayName: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const [data, candidateData] = await Promise.all([
        courseMembersApi.list(courseId),
        courseMembersApi.search(courseId, query).catch(() => []),
      ]);
      setMembers(data || []);
      setCandidates(candidateData || []);
    } catch {
      setMembers([]);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, query]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const addStudent = async (studentId?: string) => {
    if (!studentId && !query.trim()) return;
    setAdding(true);
    setMessage('');
    try {
      if (studentId) {
        await courseMembersApi.addBatch(courseId, [studentId]);
      } else {
        await courseMembersApi.add(courseId, query.trim());
      }
      setMessage(t('course_students.added'));
      setQuery('');
      loadMembers();
    } catch (e: any) {
      setMessage(e.message || t('course_students.add_failed'));
    } finally {
      setAdding(false);
    }
  };

  const removeStudent = async (memberId: string) => {
    try {
      await courseMembersApi.remove(courseId, memberId);
      loadMembers();
    } catch {
      setMessage(t('course_students.remove_failed'));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <h2 className="text-lg font-extrabold text-gray-900">{t('course_students.title')}</h2>

      <div className="flex gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('course_students.email_placeholder')}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2]"
        />
        <button
          onClick={() => addStudent()}
          disabled={adding}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0056D2] text-white rounded-xl font-bold text-sm disabled:opacity-50"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          {t('course_students.add')}
        </button>
      </div>

      {candidates.length > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-xs font-extrabold text-gray-500 uppercase mb-3">{t('course_students.default_roster')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {candidates.slice(0, 8).map((student) => (
              <button
                key={student.id}
                onClick={() => addStudent(student.id)}
                disabled={adding}
                className="flex items-center justify-between rounded-xl bg-white border border-blue-100 p-3 text-left hover:border-[#0056D2] transition-colors disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-bold text-gray-800">{student.displayName}</span>
                  <span className="block text-xs text-gray-400">{student.username}</span>
                </span>
                <UserPlus size={16} className="text-[#0056D2]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className="text-sm font-bold px-4 py-2 rounded-xl bg-green-50 text-green-600">{message}</div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-400 font-bold">{t('course.loading')}</div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center text-gray-400 font-bold">{t('course_students.empty')}</div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0056D2] text-white flex items-center justify-center text-xs font-bold">
                  {m.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{m.displayName}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
              </div>
              <button
                onClick={() => removeStudent(m.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CoursewareTab({ courseId, t }: { courseId: string; t: (k: string) => string }) {
  const [files, setFiles] = useState<CoursewareFile[]>([]);
  const [lessonNodeId, setLessonNodeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      const data = await coursewareFilesApi.list(courseId, lessonNodeId || undefined);
      setFiles(data || []);
    } catch {
      setFiles([]);
    }
  }, [courseId, lessonNodeId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (file: File) => {
    if (!file.name.match(/\.(pdf|pptx)$/i)) {
      setMessage(t('course_courseware.invalid_type'));
      return;
    }
    setUploading(true);
    setProgress(0);
    setMessage('');

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      let finalLessonNodeId = lessonNodeId;
      if (!finalLessonNodeId) {
        setMessage('正在为您自动创建课时节点...');
        const nodes = await lessonNodesApi.list(courseId);
        if (nodes && nodes.length > 0) {
          finalLessonNodeId = nodes[0].id;
        } else {
          const created = await lessonNodesApi.create(courseId, {
            title: `Live Lesson ${new Date().toLocaleDateString()}`
          });
          finalLessonNodeId = created.lessonNode.id;
        }
        setLessonNodeId(finalLessonNodeId);
      }

      await coursesApi.uploadCourseware(courseId, file, finalLessonNodeId);
      setProgress(100);
      setMessage(t('course_courseware.uploaded').replace('{filename}', file.name));
      loadFiles();
    } catch (e: any) {
      setMessage(e.message || t('course.upload_failed'));
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <h2 className="text-lg font-extrabold text-gray-900">{t('course_courseware.title')}</h2>
      <LiveClassSelect courseId={courseId} t={t} value={lessonNodeId} onChange={setLessonNodeId} />

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          dragOver ? 'border-[#0056D2] bg-blue-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <UploadCloud size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-bold text-gray-500 mb-2">{t('course_courseware.drop_hint')}</p>
        <p className="text-xs text-gray-400 mb-4">{t('course_courseware.format_hint')}</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0056D2] text-white rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all">
          <FileText size={16} />
          {t('course_courseware.select_file')}
          <input
            type="file"
            accept=".pdf,.pptx"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
        </label>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#0056D2] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 font-bold">{progress}%</p>
        </div>
      )}

      {message && (
        <div className="text-sm font-bold px-4 py-2 rounded-xl bg-blue-50 text-[#0056D2]">{message}</div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-600">{t('course_courseware.files')}</h3>
          {files.map(f => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-[#0056D2]" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{f.filename}</p>
                  <p className="text-xs text-gray-400">
                    {f.liveClassTitle || t('live_class.unassigned')} · {f.pageCount} {t('homework.pages')}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                f.status === 'ready' ? 'bg-green-100 text-green-700' :
                f.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {f.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleTab({ courseId, t }: { courseId: string; t: (k: string) => string }) {
  const [nodes, setNodes] = useState<LessonNode[]>([]);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [files, setFiles] = useState<CoursewareFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newEndsAt, setNewEndsAt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');
  const [message, setMessage] = useState('');

  const loadNodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lessonNodesApi.list(courseId);
      setNodes(data || []);
      const [memberData, fileData] = await Promise.all([
        courseMembersApi.list(courseId).catch(() => []),
        coursewareFilesApi.list(courseId).catch(() => []),
      ]);
      setMembers(memberData || []);
      setFiles(fileData || []);
    } catch {
      setNodes([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadNodes(); }, [loadNodes]);

  const createNode = async () => {
    if (!newTitle.trim()) return;
    try {
      await lessonNodesApi.create(courseId, {
        title: newTitle.trim(),
        startsAt: newStartsAt || undefined,
        endsAt: newEndsAt || undefined,
      });
      setNewTitle('');
      setNewStartsAt('');
      setNewEndsAt('');
      loadNodes();
    } catch (e: any) {
      setMessage(e.message || t('course_schedule.create_failed'));
    }
  };

  const updateNode = async (id: string) => {
    try {
      await lessonNodesApi.update(id, {
        title: editTitle,
        endsAt: editEndsAt || undefined,
      });
      setEditingId(null);
      loadNodes();
    } catch {
      setMessage(t('course_schedule.update_failed'));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-extrabold text-gray-900">{t('course_schedule.title')}</h2>
        <p className="text-sm text-gray-500 font-medium">{t('live_class.model_hint')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder={t('course_schedule.node_title')}
          className="flex-1 min-w-[180px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2]"
        />
        <input
          type="datetime-local"
          value={newStartsAt}
          onChange={e => setNewStartsAt(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2]"
        />
        <input
          type="datetime-local"
          value={newEndsAt}
          onChange={e => setNewEndsAt(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2]"
        />
        <button
          onClick={createNode}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0056D2] text-white rounded-xl font-bold text-sm"
        >
          <Plus size={16} />
          {t('course_schedule.add_node')}
        </button>
      </div>

      {message && (
        <div className="text-sm font-bold px-4 py-2 rounded-xl bg-red-50 text-red-600">{message}</div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-400 font-bold">{t('course.loading')}</div>
      ) : nodes.length === 0 ? (
        <div className="py-8 text-center text-gray-400 font-bold">{t('course_schedule.empty')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map(node => {
            const style = styleFromSeed(node.styleSeed || node.id.charCodeAt(0) || 1);
            return (
              <div
                key={node.id}
                className="rounded-2xl border-2 overflow-hidden transition-all hover:shadow-md"
                style={{ borderColor: style.borderColor, backgroundColor: style.bgColor }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShapeIcon shape={style.icon} size={18} color={style.borderColor} />
                    {editingId === node.id ? (
                      <div className="flex-1 space-y-1">
                        <input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onBlur={() => updateNode(node.id)}
                          onKeyDown={e => e.key === 'Enter' && updateNode(node.id)}
                          className="w-full text-sm font-bold bg-white rounded-lg px-2 py-1 outline-none border border-gray-200"
                          autoFocus
                        />
                        <input
                          type="datetime-local"
                          value={editEndsAt}
                          onChange={e => setEditEndsAt(e.target.value)}
                          onBlur={() => updateNode(node.id)}
                          className="w-full text-xs bg-white rounded-lg px-2 py-1 outline-none border border-gray-200"
                        />
                      </div>
                    ) : (
                      <h3
                        className="flex-1 text-sm font-bold text-gray-800 cursor-pointer hover:text-[#0056D2]"
                        onClick={() => { setEditingId(node.id); setEditTitle(node.title); setEditEndsAt(node.endsAt ? node.endsAt.slice(0, 16) : ''); }}
                      >
                        {node.title}
                      </h3>
                    )}
                    <button
                      onClick={() => { setEditingId(node.id); setEditTitle(node.title); setEditEndsAt(node.endsAt ? node.endsAt.slice(0, 16) : ''); }}
                      className="p-1 rounded hover:bg-white/50 text-gray-400 hover:text-[#0056D2]"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-xl bg-white/70 p-2 text-center">
                      <p className="text-lg font-black text-gray-900">{members.length}</p>
                      <p className="text-[10px] font-bold text-gray-400">{t('live_class.students')}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 p-2 text-center">
                      <p className="text-lg font-black text-gray-900">{files.filter((f) => f.lessonNodeId === node.id && f.type !== 'xlsx').length}</p>
                      <p className="text-[10px] font-bold text-gray-400">{t('live_class.coursewares')}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 p-2 text-center">
                      <p className="text-lg font-black text-gray-900">{files.filter((f) => f.lessonNodeId === node.id && f.type === 'xlsx').length}</p>
                      <p className="text-[10px] font-bold text-gray-400">{t('live_class.homework')}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium mb-2">
                    {node.startsAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(node.startsAt).toLocaleString()}
                      </div>
                    )}
                    {node.endsAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {'→'} {new Date(node.endsAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      node.status === 'active' ? 'bg-red-100 text-red-600' :
                      node.status === 'completed' ? 'bg-gray-200 text-gray-500' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {node.status === 'active' ? t('classroom.live') :
                       node.status === 'completed' ? t('classroom.stopped') :
                       t('course_schedule.scheduled')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HomeworkTab({ courseId, t }: { courseId: string; t: (k: string) => string }) {
  const [lessonNodeId, setLessonNodeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<HomeworkImportResult | null>(null);
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [tasksCount, setTasksCount] = useState(0);

  useEffect(() => {
    if (!lessonNodeId) {
      setTasksCount(0);
      return;
    }
    homeworkApi.tasks(courseId, { lessonNodeId })
      .then((tasks) => {
        setTasksCount(tasks.length);
      })
      .catch(() => {
        setTasksCount(0);
      });
  }, [courseId, lessonNodeId]);

  const handleUpload = async (file: File) => {
    if (!lessonNodeId) {
      setMessage(t('live_class.required_before_upload'));
      return;
    }
    if (!file.name.match(/\.xlsx?$/i)) {
      setMessage(t('course_homework.invalid_type'));
      return;
    }
    setUploading(true);
    setMessage('');
    setResult(null);

    try {
      const base64 = await fileToBase64(file);
      const result = await assignmentsApi.import(courseId, file.name, base64, lessonNodeId);
      setResult(result);
      setMessage(t('course_homework.imported').replace('{filename}', file.name));
      // Re-fetch tasks count dynamically from backend
      const tasks = await homeworkApi.tasks(courseId, { lessonNodeId });
      setTasksCount(tasks.length);
    } catch (e: any) {
      setMessage(e.message || t('course_homework.import_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!lessonNodeId) return;
    try {
      const blob = await assignmentsApi.exportBlob(courseId, lessonNodeId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assignment-${courseId}-${lessonNodeId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setMessage(e.message || 'Download failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900">{t('course_homework.title')}</h2>
        {lessonNodeId && (
          <button
            onClick={handleDownload}
            disabled={tasksCount === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              tasksCount > 0
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={tasksCount === 0 ? t('course_homework.no_tasks_download') : t('course_homework.download')}
          >
            <Download size={16} />
            {t('course_homework.download')} ({tasksCount})
          </button>
        )}
      </div>
      <LiveClassSelect courseId={courseId} t={t} value={lessonNodeId} onChange={setLessonNodeId} />

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 space-y-2">
        <p className="font-extrabold text-gray-800">{t('course_homework.ai_prompt_title')}</p>
        <p>{t('course_homework.ai_prompt_desc')}</p>
        <code className="block whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-gray-700 border border-gray-100">
{`course_code, unit, lesson, task_id, task_type, zh_text, pinyin, translation_ru, translation_kk, publish_to_homework, publish_to_vocab
CZU-CHN-001, 1, 1, CZU-CHN-001-L01-001, pronunciation, 大家好，我叫阿合买提。, Dajia hao, wo jiao Ahemaiti., Здравствуйте..., Сәлеметсіз бе..., TRUE, FALSE`}
        </code>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          dragOver ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <FileSpreadsheet size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-bold text-gray-500 mb-2">{t('course_homework.drop_hint')}</p>
        <p className="text-xs text-gray-400 mb-4">XLSX</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all">
          <FileSpreadsheet size={16} />
          {t('course_homework.select_file')}
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
        </label>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          {t('course_homework.processing')}
        </div>
      )}

      {message && (
        <div className={`text-sm font-bold px-4 py-2 rounded-xl ${
          message.includes('failed') || message.includes('invalid') || message.includes('required')
            ? 'bg-red-50 text-red-600'
            : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50">
              <p className="text-2xl font-extrabold text-[#0056D2]">{result.tasksCount}</p>
              <p className="text-xs font-bold text-gray-500">{t('course_homework.tasks_parsed')}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50">
              <p className="text-2xl font-extrabold text-purple-600">{result.vocabCount}</p>
              <p className="text-xs font-bold text-gray-500">{t('course_homework.vocab_parsed')}</p>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-yellow-50">
              <p className="text-sm font-bold text-yellow-700 mb-1">{t('course.excel_warnings')}:</p>
              <ul className="text-xs text-yellow-600 space-y-1">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {result.errorRows.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50">
              <p className="text-sm font-bold text-red-700 mb-1">{t('course_homework.error_rows')}:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {result.errorRows.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LiveTab({ courseId, t, onEnterLive }: { courseId: string; t: (k: string) => string; onEnterLive?: (courseId: string, lessonNodeId: string) => void }) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [lessonNodes, setLessonNodes] = useState<LessonNode[]>([]);
  const [selectedLessonNodeId, setSelectedLessonNodeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const active = await liveSessionsApi.getActive(courseId);
      if (active) {
        const sessionData = active as any;
        setSessions([{
          id: active.id,
          title: '',
          status: active.status,
          startedAt: active.startedAt,
          lessonNodeId: sessionData.lessonNodeId || '',
        }]);
      } else {
        setSessions([]);
      }
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadLessonNodes = useCallback(async () => {
    try {
      const data = await lessonNodesApi.list(courseId);
      setLessonNodes(data || []);
      if (data?.length > 0 && !selectedLessonNodeId) {
        setSelectedLessonNodeId(data[0].id);
      }
    } catch {
      setLessonNodes([]);
    }
  }, [courseId, selectedLessonNodeId]);

  useEffect(() => { loadSessions(); loadLessonNodes(); }, [loadSessions, loadLessonNodes]);

  const createLive = async () => {
    if (!selectedLessonNodeId) {
      setMessage(t('course_live.select_lesson'));
      return;
    }
    setCreating(true);
    setMessage('');
    try {
      const session = await liveSessionsApi.create(courseId, selectedLessonNodeId, 'screen');
      setMessage(t('course_live.created'));
      loadSessions();
    } catch (e: any) {
      setMessage(e.message || t('course_live.create_failed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <h2 className="text-lg font-extrabold text-gray-900">{t('course_live.title')}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">{t('course_live.select_lesson')}</label>
          <select
            value={selectedLessonNodeId}
            onChange={e => setSelectedLessonNodeId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0056D2]"
          >
            <option value="">{t('course_live.no_lessons')}</option>
            {lessonNodes.map(n => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={createLive}
          disabled={creating || !selectedLessonNodeId}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
          {t('course_live.create')}
        </button>
      </div>

      {message && (
        <div className={`text-sm font-bold px-4 py-2 rounded-xl ${
          message.includes('failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-400 font-bold">{t('course.loading')}</div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center text-gray-400 font-bold">{t('course_live.empty')}</div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${s.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.title || `Live ${s.id.slice(0, 8)}`}</p>
                  <p className="text-xs text-gray-400">{new Date(s.startedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  s.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s.status === 'active' ? t('classroom.live') : t('classroom.stopped')}
                </span>
                {s.recordingUrl && (
                  <button className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
                    <Download size={14} />
                  </button>
                )}
                {s.status === 'active' && (
                  <button
                    onClick={() => s.lessonNodeId && onEnterLive?.(courseId, s.lessonNodeId)}
                    disabled={!s.lessonNodeId}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0056D2] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    <Play size={12} />
                    {t('course_live.enter')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
