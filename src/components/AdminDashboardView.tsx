import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  PlayCircle,
  MessageSquare,
  Subtitles,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Users,
  BookOpen,
  Clock,
  Filter,
  Download,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { adminApi, coursesApi } from '../services/apiClient.ts';
import type {
  AdminLiveSession,
  AdminRecording,
  AdminNote,
  AdminTranscript,
  AdminCourseware,
  AdminAssignmentImport,
  AdminLearningProgress,
  CleanupLearningRecordsResult,
  Course
} from '../services/apiClient.ts';

type AdminTab = 'live' | 'recordings' | 'notes' | 'transcripts' | 'coursewares' | 'assignments' | 'progress';

interface AdminDashboardViewProps {
  onLogout?: () => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onLogout }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('live');
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveSessions, setLiveSessions] = useState<AdminLiveSession[]>([]);
  const [recordings, setRecordings] = useState<AdminRecording[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [transcripts, setTranscripts] = useState<AdminTranscript[]>([]);
  const [coursewares, setCoursewares] = useState<AdminCourseware[]>([]);
  const [assignmentImports, setAssignmentImports] = useState<AdminAssignmentImport[]>([]);
  const [learningProgress, setLearningProgress] = useState<AdminLearningProgress | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupLearningRecordsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTranscriptSession, setFilterTranscriptSession] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    coursesApi.list().then(setCourses).catch(() => setCourses([]));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'live':
          setLiveSessions(await adminApi.liveSessions());
          break;
        case 'recordings':
          setRecordings(await adminApi.recordings(filterCourse || undefined));
          break;
        case 'notes':
          setNotes(await adminApi.notes());
          break;
        case 'transcripts':
          setTranscripts(await adminApi.transcripts(filterTranscriptSession || undefined));
          break;
        case 'coursewares':
          setCoursewares(await adminApi.coursewares());
          break;
        case 'assignments':
          setAssignmentImports(await adminApi.assignmentImports());
          break;
        case 'progress':
          setLearningProgress(await adminApi.learningProgress(filterCourse ? { courseId: filterCourse } : undefined));
          break;
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterCourse, filterTranscriptSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => loadData();

  const handleToggleNoteVisibility = async (noteId: string, current: 'visible' | 'hidden') => {
    try {
      await adminApi.toggleNoteVisibility(noteId, current === 'visible' ? 'hidden' : 'visible');
      setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, visibility: current === 'visible' ? 'hidden' : 'visible' } : n));
    } catch (e) {
      console.error('Failed to toggle note:', e);
    }
  };

  const handleDeleteRecording = async (id: string) => {
    try {
      await adminApi.deleteRecording(id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Failed to delete recording:', e);
    }
  };

  const handleCleanupLearningRecords = async (dryRun: boolean) => {
    try {
      const result = await adminApi.cleanupZombieLearningRecords(dryRun);
      setCleanupResult(result);
      if (!dryRun) await loadData();
    } catch (e) {
      console.error('Failed to clean zombie learning records:', e);
    }
  };

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const fmtDate = (iso: string) => {
    if (!iso) return '\u2014';
    return new Date(iso).toLocaleString();
  };

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'live', label: t('admin.live.tab'), icon: Video },
    { id: 'recordings', label: t('admin.recordings.tab'), icon: PlayCircle },
    { id: 'notes', label: t('admin.notes.tab'), icon: MessageSquare },
    { id: 'transcripts', label: t('admin.transcripts.tab'), icon: Subtitles },
    { id: 'coursewares', label: t('admin.coursewares.tab'), icon: FileText },
    { id: 'assignments', label: t('admin.assignments.tab'), icon: FileSpreadsheet },
    { id: 'progress', label: t('admin.progress.tab'), icon: TrendingUp },
  ];

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Filter size={16} />
        <span className="text-xs font-medium">{t('admin.filters')}</span>
      </div>
      <select
        value={filterCourse}
        onChange={(e) => setFilterCourse(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
      >
        <option value="">{t('admin.all_courses')}</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>
      {activeTab === 'live' && (
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
        >
          <option value="">{t('admin.all_statuses')}</option>
          <option value="active">{t('admin.status_active')}</option>
          <option value="ended">{t('admin.status_ended')}</option>
        </select>
      )}
      {activeTab === 'coursewares' && (
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
        >
          <option value="">{t('admin.all_types')}</option>
          <option value="pdf">PDF</option>
          <option value="pptx">PPTX</option>
          <option value="xlsx">XLSX</option>
        </select>
      )}
      {activeTab === 'transcripts' && (
        <select
          value={filterTranscriptSession}
          onChange={(e) => setFilterTranscriptSession(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
        >
          <option value="">{t('admin.all_sessions')}</option>
          {liveSessions.map((s) => (
            <option key={s.id} value={s.id}>{s.lessonTitle || s.id.slice(0, 8)}</option>
          ))}
        </select>
      )}
      <button
        onClick={handleRefresh}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <RefreshCw size={14} />
        {t('admin.refresh')}
      </button>
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <FileText size={48} className="mb-4 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );

  const renderLive = () => {
    const filtered = liveSessions.filter((s) => {
      if (filterCourse && s.courseId !== filterCourse) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
    if (filtered.length === 0) return renderEmpty(t('admin.live.empty'));
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">{t('admin.live.id')}</th>
              <th className="py-3 px-4">{t('admin.live.course')}</th>
              <th className="py-3 px-4">{t('admin.live.lesson')}</th>
              <th className="py-3 px-4">{t('admin.live.teacher')}</th>
              <th className="py-3 px-4">{t('admin.live.status')}</th>
              <th className="py-3 px-4">{t('admin.live.started')}</th>
              <th className="py-3 px-4">{t('admin.live.ended')}</th>
              <th className="py-3 px-4">{t('admin.live.recording')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4 font-mono text-xs text-gray-500">{s.id.slice(0, 8)}</td>
                <td className="py-3 px-4">{s.courseTitle || '\u2014'}</td>
                <td className="py-3 px-4">{s.lessonTitle || '\u2014'}</td>
                <td className="py-3 px-4">{s.teacherName || '\u2014'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.status === 'active' ? t('admin.status_active') : t('admin.status_ended')}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500">{fmtDate(s.startedAt)}</td>
                <td className="py-3 px-4 text-gray-500">{fmtDate(s.endedAt)}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.recordingStatus === 'recording' ? 'bg-red-100 text-red-700' :
                    s.recordingStatus === 'saved' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {s.recordingStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRecordings = () => {
    if (recordings.length === 0) return renderEmpty(t('admin.recordings.empty'));
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">{t('admin.recordings.type')}</th>
              <th className="py-3 px-4">{t('admin.recordings.title')}</th>
              <th className="py-3 px-4">{t('admin.recordings.course')}</th>
              <th className="py-3 px-4">{t('admin.recordings.person')}</th>
              <th className="py-3 px-4">{t('admin.recordings.duration')}</th>
              <th className="py-3 px-4">{t('admin.recordings.created')}</th>
              <th className="py-3 px-4">{t('admin.recordings.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {recordings.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'lecture' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {r.type === 'lecture' ? t('admin.recordings.lecture') : t('admin.recordings.student_rec')}
                  </span>
                </td>
                <td className="py-3 px-4">{r.title || r.filename}</td>
                <td className="py-3 px-4">{r.courseTitle || '\u2014'}</td>
                <td className="py-3 px-4">{r.type === 'lecture' ? (r.teacherName || '\u2014') : (r.studentName || '\u2014')}</td>
                <td className="py-3 px-4 font-mono text-xs">{fmtDuration(r.durationSec)}</td>
                <td className="py-3 px-4 text-gray-500">{fmtDate(r.createdAt)}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleDeleteRecording(r.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title={t('admin.recordings.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderNotes = () => {
    if (notes.length === 0) return renderEmpty(t('admin.notes.empty'));
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Download size={14} />
            {t('admin.notes.export')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">{t('admin.notes.session')}</th>
                <th className="py-3 px-4">{t('admin.notes.student')}</th>
                <th className="py-3 px-4">{t('admin.notes.body')}</th>
                <th className="py-3 px-4">{t('admin.notes.visibility')}</th>
                <th className="py-3 px-4">{t('admin.notes.created')}</th>
                <th className="py-3 px-4">{t('admin.notes.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-xs text-gray-500">{n.sessionTitle || n.liveSessionId.slice(0, 8)}</td>
                  <td className="py-3 px-4">{n.studentName || '\u2014'}</td>
                  <td className="py-3 px-4 max-w-xs truncate">{n.body}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${n.visibility === 'visible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {n.visibility === 'visible' ? t('admin.notes.visible') : t('admin.notes.hidden')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(n.createdAt)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleNoteVisibility(n.id, n.visibility)}
                      className="text-gray-500 hover:text-blue-600 p-1"
                      title={n.visibility === 'visible' ? t('admin.notes.hide') : t('admin.notes.show')}
                    >
                      {n.visibility === 'visible' ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTranscripts = () => {
    if (transcripts.length === 0) return renderEmpty(t('admin.transcripts.empty'));
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Download size={14} />
            {t('admin.transcripts.export')}
          </button>
        </div>
        <div className="space-y-4">
          {transcripts.map((tr) => (
            <div key={tr.liveSessionId} className="bg-white border border-gray-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{tr.courseTitle} \u2014 {tr.liveSessionId.slice(0, 8)}</h4>
              {tr.segments.length === 0 ? (
                <p className="text-xs text-gray-400">{t('admin.transcripts.no_segments')}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tr.segments.map((seg) => (
                    <div key={seg.id} className="flex gap-4 text-xs">
                      <span className="text-gray-400 shrink-0 w-20">{fmtDate(seg.createdAt)}</span>
                      <div className="flex-1">
                        <p className="text-gray-900">{seg.sourceText}</p>
                        <p className="text-gray-500">{seg.translatedText}</p>
                      </div>
                      <span className="text-gray-400 shrink-0">{seg.language}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCoursewares = () => {
    const filtered = coursewares.filter((f) => {
      if (filterType && f.type !== filterType) return false;
      return true;
    });
    if (filtered.length === 0) return renderEmpty(t('admin.coursewares.empty'));
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">{t('admin.coursewares.filename')}</th>
              <th className="py-3 px-4">{t('admin.coursewares.type')}</th>
              <th className="py-3 px-4">{t('admin.coursewares.course')}</th>
              <th className="py-3 px-4">{t('admin.coursewares.status')}</th>
              <th className="py-3 px-4">{t('admin.coursewares.pages')}</th>
              <th className="py-3 px-4">{t('admin.coursewares.size')}</th>
              <th className="py-3 px-4">{t('admin.coursewares.created')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4 truncate max-w-xs">{f.filename}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 uppercase">
                    {f.type}
                  </span>
                </td>
                <td className="py-3 px-4">{f.courseTitle || '\u2014'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    f.renderStatus === 'ready' ? 'bg-green-100 text-green-700' :
                    f.renderStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    f.renderStatus === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {f.renderStatus}
                  </span>
                </td>
                <td className="py-3 px-4">{f.pageCount}</td>
                <td className="py-3 px-4 text-gray-500">{fmtSize(f.sizeBytes)}</td>
                <td className="py-3 px-4 text-gray-500">{fmtDate(f.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAssignments = () => {
    if (assignmentImports.length === 0) return renderEmpty(t('admin.assignments.empty'));
    return (
      <div className="space-y-3">
        {assignmentImports.map((imp) => (
          <div key={imp.fileId} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-green-600" />
                <span className="text-sm font-semibold text-gray-900">{imp.filename}</span>
              </div>
              <span className="text-xs text-gray-400">{fmtDate(imp.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{imp.courseTitle}</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {t('admin.assignments.tasks')}: {imp.tasksCount}
              </span>
              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                {t('admin.assignments.vocab')}: {imp.vocabCount}
              </span>
              {imp.errors.length > 0 && (
                <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-medium">
                  {t('admin.assignments.errors')}: {imp.errors.length}
                </span>
              )}
            </div>
            {imp.errors.length > 0 && (
              <div className="mt-3 bg-red-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">{t('admin.assignments.error_details')}</p>
                {imp.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 font-mono">{err}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProgress = () => {
    const cleanupPanel = (
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-amber-900">学习记录清理</p>
          <p className="text-xs text-amber-700">
            定位并清理缺学生、缺任务、缺课时或缺录音引用的僵尸学习记录。
            {cleanupResult && ` 最近扫描 ${cleanupResult.scanned} 条，命中 ${cleanupResult.deleted} 条。`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleCleanupLearningRecords(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
          >
            <Eye size={14} />
            预检
          </button>
          <button
            onClick={() => handleCleanupLearningRecords(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
          >
            <Trash2 size={14} />
            清理
          </button>
        </div>
      </div>
    );

    if (!learningProgress || learningProgress.students.length === 0) {
      return (
        <div>
          {cleanupPanel}
          {renderEmpty(t('admin.progress.empty'))}
        </div>
      );
    }

    const totalStudents = learningProgress.students.length;
    let totalCompletionRate = 0;
    let totalRecordings = 0;
    let lessonCount = 0;
    for (const s of learningProgress.students) {
      for (const cp of s.courseProgress) {
        for (const lp of cp.lessonProgress) {
          totalCompletionRate += lp.completionRate;
          totalRecordings += lp.recordings;
          lessonCount++;
        }
      }
    }
    const avgCompletion = lessonCount > 0 ? Math.round(totalCompletionRate / lessonCount) : 0;

    return (
      <div>
        {cleanupPanel}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase">{t('admin.progress.total_students')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase">{t('admin.progress.avg_completion')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <PlayCircle size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase">{t('admin.progress.total_recordings')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRecordings}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">{t('admin.progress.student')}</th>
                <th className="py-3 px-4">{t('admin.progress.course')}</th>
                <th className="py-3 px-4">{t('admin.progress.lessons')}</th>
                <th className="py-3 px-4">{t('admin.progress.completion_rate')}</th>
                <th className="py-3 px-4">{t('admin.progress.recordings')}</th>
                <th className="py-3 px-4">{t('admin.progress.avg_score')}</th>
              </tr>
            </thead>
            <tbody>
              {learningProgress.students.map((student) => {
                const isExpanded = expandedStudents.has(student.studentId);
                let studentTotalTasks = 0;
                let studentCompletedTasks = 0;
                let studentRecordings = 0;
                let studentScores: number[] = [];
                for (const cp of student.courseProgress) {
                  for (const lp of cp.lessonProgress) {
                    studentTotalTasks += lp.totalTasks;
                    studentCompletedTasks += lp.completedTasks;
                    studentRecordings += lp.recordings;
                    if (lp.avgScore > 0) studentScores.push(lp.avgScore);
                  }
                }
                const studentRate = studentTotalTasks > 0 ? Math.round((studentCompletedTasks / studentTotalTasks) * 100) : 0;
                const studentAvgScore = studentScores.length > 0 ? Math.round((studentScores.reduce((a, b) => a + b, 0) / studentScores.length) * 10) / 10 : 0;

                return (
                  <React.Fragment key={student.studentId}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <button onClick={() => toggleStudentExpand(student.studentId)} className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{student.displayName}</td>
                      <td className="py-3 px-4">
                        {student.courseProgress.map((cp) => cp.courseTitle).filter(Boolean).join(', ') || '\u2014'}
                      </td>
                      <td className="py-3 px-4">
                        {student.courseProgress.reduce((sum, cp) => sum + cp.lessonProgress.length, 0)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${studentRate}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{studentRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{studentRecordings}</td>
                      <td className="py-3 px-4">{studentAvgScore || '\u2014'}</td>
                    </tr>
                    {isExpanded && student.courseProgress.map((cp) => (
                      <tr key={cp.courseId} className="bg-gray-50/50">
                        <td></td>
                        <td colSpan={6} className="py-2 px-4">
                          <div className="pl-8">
                            <p className="text-xs font-semibold text-gray-500 mb-2">{cp.courseTitle}</p>
                            {cp.lessonProgress.length === 0 ? (
                              <p className="text-xs text-gray-400">{t('admin.progress.no_lessons')}</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {cp.lessonProgress.map((lp) => (
                                  <div key={lp.lessonNodeId} className="bg-white rounded-lg border border-gray-100 p-3">
                                    <p className="text-xs font-medium text-gray-900 mb-1">{lp.lessonTitle}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>{lp.completedTasks}/{lp.totalTasks}</span>
                                      <span className="font-semibold text-blue-600">{lp.completionRate}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lp.completionRate}%` }} />
                                    </div>
                                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                      <span>{lp.recordings} {t('admin.progress.recordings')}</span>
                                      {lp.avgScore > 0 && <span>Ø {lp.avgScore}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'live': return renderLive();
      case 'recordings': return renderRecordings();
      case 'notes': return renderNotes();
      case 'transcripts': return renderTranscripts();
      case 'coursewares': return renderCoursewares();
      case 'assignments': return renderAssignments();
      case 'progress': return renderProgress();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('admin.title')}</h1>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
          {t('nav.logout')}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilterCourse('');
                setFilterStatus('');
                setFilterType('');
                setFilterTranscriptSession('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {renderFilters()}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="text-gray-400 animate-spin" />
          <span className="ml-3 text-sm text-gray-400">{t('admin.loading')}</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
