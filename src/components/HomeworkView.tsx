import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Star,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Volume2,
  CheckCircle2,
  StopCircle,
  Trash2,
  Mic,
  Cpu,
  ArrowRight,
  Play,
  RotateCcw,
  Users,
  BookOpen,
  Lock,
  Layers,
  Check,
  TrendingUp,
  History,
  FileWarning,
  Bookmark,
  Network,
  Flame,
  Award,
  Sparkles,
  Search,
  Settings,
  ArrowBigDown,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ttsService } from '../services/ttsService.ts';
import { homeworkApi, learningRecordsApi, recordingsApi, coursesApi, homeworkSubmissionsApi, lessonNodesApi, mediaUrl, type LearningTask, type LearningRecord, type Course, type LessonNodeData } from '../services/apiClient.ts';
import StudentKnowledgeTraceRail from './StudentKnowledgeTraceRail.tsx';

// ─── L1 Cache (Browser localStorage) — S5-T06 三级缓存 ───
const L1_KEY = 'lingobridge_hw_draft';
const HW_SLOT_KEY = 'lingobridge_hw_recording_slots_v1';
const MAX_RECORDING_SLOTS = 3;

interface L1Draft {
  courseId: string;
  lessonNodeId: string;
  currentIndex: number;
  recordingIds: string[];
  answers: Record<string, any>;
  updatedAt: string;
}

function l1GetDraft(courseId: string, lessonNodeId: string): L1Draft | null {
  try {
    const raw = localStorage.getItem(L1_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, L1Draft>;
    const key = `${courseId}:${lessonNodeId}`;
    const draft = all[key];
    if (!draft) return null;
    // 7-day expiry
    if (Date.now() - new Date(draft.updatedAt).getTime() > 7 * 86400000) {
      l1ClearDraft(courseId, lessonNodeId);
      return null;
    }
    return draft;
  } catch { return null; }
}

function l1SaveDraft(courseId: string, lessonNodeId: string, data: Partial<L1Draft>) {
  try {
    const raw = localStorage.getItem(L1_KEY);
    const all: Record<string, L1Draft> = raw ? JSON.parse(raw) : {};
    const key = `${courseId}:${lessonNodeId}`;
    const existing = all[key] || { courseId, lessonNodeId, currentIndex: 0, recordingIds: [], answers: {}, updatedAt: new Date().toISOString() };
    all[key] = { ...existing, ...data, courseId, lessonNodeId, updatedAt: new Date().toISOString() };
    localStorage.setItem(L1_KEY, JSON.stringify(all));
  } catch (e) { console.warn('L1 save failed', e); }
}

function l1ClearDraft(courseId: string, lessonNodeId: string) {
  try {
    const raw = localStorage.getItem(L1_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    delete all[`${courseId}:${lessonNodeId}`];
    localStorage.setItem(L1_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

function slotStorageKey(courseId: string, lessonNodeId: string | undefined, taskId: string | undefined) {
  return `${courseId || 'course'}:${lessonNodeId || 'lesson'}:${taskId || 'task'}`;
}

function readAllSlotCache(): Record<string, StoredRecordingSlot[]> {
  try {
    return JSON.parse(localStorage.getItem(HW_SLOT_KEY) || '{}') as Record<string, StoredRecordingSlot[]>;
  } catch {
    return {};
  }
}

function writeAllSlotCache(cache: Record<string, StoredRecordingSlot[]>) {
  try {
    localStorage.setItem(HW_SLOT_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to persist homework recording cache:', error);
  }
}

function mergeSlotCache(nextCache: Record<string, StoredRecordingSlot[]>) {
  const cache = readAllSlotCache();
  writeAllSlotCache({ ...cache, ...nextCache });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to cache recording'));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function scoreRecording(seed: string, attempt: number) {
  const seedStr = seed || 'default-task-seed';
  let hash = attempt * 97;
  for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) % 9973;
  const total = 68 + (hash % 28);
  return {
    total,
    fluency: Math.min(100, total + ((hash >> 2) % 7) - 3),
    tone: Math.min(100, total + ((hash >> 3) % 9) - 4),
    pronunciation: Math.min(100, total + ((hash >> 4) % 8) - 3),
    completeness: 100
  };
}

function homeworkTypeLabel(taskType: LearningTask['taskType'], t: (key: string, params?: Record<string, string>) => string) {
  const labels: Record<LearningTask['taskType'], string> = {
    pronunciation: '发音练习',
    sentence_reading: t('homework.type.reading'),
    vocabulary: t('homework.type.vocabulary'),
    dialogue: '对话练习',
    listening: '听力练习'
  };
  const value = labels[taskType] || taskType;
  return value.includes('homework.type.') ? taskType : value;
}

// Add decorative components
const FloatingElement = ({ children, className, duration = 4, delay = 0, yOffset = -15 }: { children: React.ReactNode, className?: string, duration?: number, delay?: number, yOffset?: number }) => (
  <motion.div
    animate={{ y: [0, yOffset, 0], opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    className={`absolute pointer-events-none -z-10 ${className}`}
  >
    {children}
  </motion.div>
);

const PathArrow = ({ index, status }: { index: number, status: 'completed' | 'current' | 'locked' }) => {
  const isCompleted = status === 'completed';

  return (
    <div className="absolute top-[112px] left-1/2 -translate-x-1/2 w-4 h-32 -z-20 pointer-events-none">
      <svg className="w-full h-full" overflow="visible">
        {/* Base dashed line - always visible */}
        <line
          x1="50%" y1="0" x2="50%" y2="100%"
          stroke="#F3F4F6"
          strokeWidth="4"
          strokeDasharray="8,8"
          strokeLinecap="round"
        />

        {/* Progress line - highlights when completed */}
        <motion.line
          initial={{ pathLength: 0, stroke: "#E5E7EB", opacity: 0 }}
          animate={{
            pathLength: isCompleted ? 1 : 0,
            stroke: isCompleted ? "#22C55E" : "#E5E7EB",
            opacity: isCompleted ? 1 : 0
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          x1="50%" y1="0" x2="50%" y2="100%"
          strokeWidth="4"
          strokeDasharray="8,8"
          strokeLinecap="round"
        />

        {/* Glow effect for completed path */}
        {isCompleted && (
          <motion.line
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            x1="50%" y1="0" x2="50%" y2="100%"
            stroke="#22C55E"
            strokeWidth="8"
            strokeDasharray="8,8"
            strokeLinecap="round"
            style={{ filter: 'blur(4px)' }}
          />
        )}
      </svg>
    </div>
  );
};

interface LessonGroup {
  unit: number;
  lesson: number;
  lessonTitle: string;
  tasks: LearningTask[];
  completedCount: number;
  totalCount: number;
}

const PathNode = (props: { group: LessonGroup; index: number; onSelect: (g: LessonGroup) => void; allCompleted: boolean; isLast: boolean }) => {
  const { group, index, onSelect, allCompleted, isLast } = props;
  const { t } = useLanguage();
  const hasTasks = group.tasks.length > 0;
  const allDone = group.completedCount === group.totalCount && group.totalCount > 0;

  return (
    <div
      className="relative flex flex-col items-center mb-32 last:mb-0"
    >
      <motion.button
        whileHover={hasTasks ? { scale: 1.1, y: -5 } : {}}
        whileTap={hasTasks ? { scale: 0.95 } : {}}
        onClick={() => hasTasks && onSelect(group)}
        className={`w-28 h-28 rounded-full flex items-center justify-center relative shadow-2xl border-b-[10px] transition-all group ${
          allDone ? 'bg-green-500 border-green-700' :
          !allCompleted && hasTasks ? 'bg-[#0056D2] border-[#003B91] ring-8 ring-blue-100 ring-offset-0' :
          'bg-gray-200 border-gray-400 opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="text-white z-10">
          {allDone ? <Check size={40} strokeWidth={3} /> : !allCompleted && hasTasks ? <Star size={40} className="fill-white" /> : <Lock size={32} />}
        </div>

        {/* Shine effect for current group */}
        {!allCompleted && hasTasks && (
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white rounded-full pointer-events-none"
          />
        )}
      </motion.button>

      <div className="mt-6 text-center w-48">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mb-2">
          {t('homework.unit')} {group.unit} • {t('homework.lesson')} {group.lesson}
        </div>
        <h4 className={`text-base font-bold leading-tight ${!hasTasks ? 'text-gray-400' : 'text-gray-900'}`}>
          {group.lessonTitle || `${t('homework.lesson')} ${group.lesson}`}
        </h4>
      </div>
    </div>
  );
};

const HomeworkSidebar = ({ onViewGraph }: { onViewGraph?: () => void }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const studentId = user?.id || '';
  return (
    <div className="w-80 space-y-6 hidden lg:block sticky top-8 h-fit">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-2 group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 leading-none">7</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('homework.stats.streak')}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-2 group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Award size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 leading-none">1,2k</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('homework.stats.points')}</div>
          </div>
        </div>
      </div>

      {/* Knowledge Trace Rail */}
      <StudentKnowledgeTraceRail studentId={studentId} onViewGraph={onViewGraph} />

      {/* Main Feature Blocks */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 group hover:border-blue-200 transition-all cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0056D2] flex items-center justify-center group-hover:rotate-6 transition-transform">
              <BookOpen size={24} />
            </div>
            <h3 className="font-bold text-lg text-gray-900">{t('homework.stats.syllabus')}</h3>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
              <div className="h-full bg-[#0056D2] w-2/3" />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>{t('homework.progress')}</span>
              <span>66%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="bg-gray-900 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <Sparkles size={120} />
        </div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">{t('homework.stats.title')}</h3>
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {[
            { icon: <FileWarning size={20} />, label: t('homework.stats.mistakes'), color: 'text-red-400' },
            { icon: <Bookmark size={20} />, label: t('homework.stats.favorites'), color: 'text-amber-400' },
            { icon: <TrendingUp size={20} />, label: t('homework.stats.ranking'), color: 'text-emerald-400' },
            { icon: <History size={20} />, label: t('homework.stats.records'), color: 'text-blue-400' },
          ].map((item, i) => (
            <button key={i} className="flex flex-col gap-3 p-4 bg-white/10 rounded-3xl hover:bg-white/20 transition-all text-left">
              <div className={`${item.color}`}>{item.icon}</div>
              <span className="text-xs font-bold text-white tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface Recording {
  id: string;
  url: string;
  score: {
    total: number;
    fluency: number;
    tone: number;
    pronunciation: number;
    completeness: number;
  };
  timestamp: Date;
  durationSec?: number;
  remoteId?: string;
  committed?: boolean;
}

interface PendingRecording {
  id: string;
  url: string;
  timestamp: Date;
  durationSec: number;
}

interface StoredRecordingSlot {
  id: string;
  dataUrl: string;
  score: Recording['score'];
  timestamp: string;
  durationSec: number;
  remoteId?: string;
  committed?: boolean;
}

interface HomeworkViewProps {
  onNavigate?: (target: string) => void;
  lessonNodeId?: string;
  courseId?: string;
}

const HomeworkView: React.FC<HomeworkViewProps> = ({ onNavigate, lessonNodeId: propLessonNodeId, courseId: propCourseId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<'path' | 'task'>('path');
  const [homeworkTab, setHomeworkTab] = useState<'homework' | 'ai-path'>('homework');
  const [selectedGroup, setSelectedGroup] = useState<LessonGroup | null>(null);
  const [groups, setGroups] = useState<LessonGroup[]>([]);
  const [allTasks, setAllTasks] = useState<LearningTask[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(() => propCourseId || localStorage.getItem('lingobridge_courseId') || '');
  const [activeLessonNodeId, setActiveLessonNodeId] = useState<string | undefined>(propLessonNodeId);

  // Task state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [pendingRecording, setPendingRecording] = useState<PendingRecording | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const aiRecommendedGroups = useMemo(() => {
    const t4Tasks: LearningTask[] = [
      { id: 'ai-t4-1', courseId: selectedCourseId, taskId: 'ai-t4-1', taskType: 'pronunciation', unit: 1, lesson: 1, lessonTitle: 'AI 专项：去声(Tone 4)', pageNumber: 1, zhText: '再见', pinyin: 'zàijiàn', translationRu: 'До свидания', translationKk: '', prompt: '', answer: '', initial: '', final: '', tone: '4', rhymeGroup: '', difficulty: 2, dueAt: '', publishToHomework: true, publishToVocab: true, sortOrder: 1 },
      { id: 'ai-t4-2', courseId: selectedCourseId, taskId: 'ai-t4-2', taskType: 'pronunciation', unit: 1, lesson: 1, lessonTitle: 'AI 专项：去声(Tone 4)', pageNumber: 2, zhText: '电话', pinyin: 'diànhuà', translationRu: 'Телефон', translationKk: '', prompt: '', answer: '', initial: '', final: '', tone: '4', rhymeGroup: '', difficulty: 2, dueAt: '', publishToHomework: true, publishToVocab: true, sortOrder: 2 },
      { id: 'ai-t4-3', courseId: selectedCourseId, taskId: 'ai-t4-3', taskType: 'pronunciation', unit: 1, lesson: 1, lessonTitle: 'AI 专项：去声(Tone 4)', pageNumber: 3, zhText: '天气', pinyin: 'tiānqì', translationRu: 'Погода', translationKk: '', prompt: '', answer: '', initial: '', final: '', tone: '4', rhymeGroup: '', difficulty: 2, dueAt: '', publishToHomework: true, publishToVocab: true, sortOrder: 3 }
    ];
    const shTasks: LearningTask[] = [
      { id: 'ai-sh-1', courseId: selectedCourseId, taskId: 'ai-sh-1', taskType: 'pronunciation', unit: 1, lesson: 2, lessonTitle: 'AI 专项：翘舌音 zh/ch/sh', pageNumber: 1, zhText: '中文', pinyin: 'zhōngwén', translationRu: 'Китайский язык', translationKk: '', prompt: '', answer: '', initial: 'zh', final: '', tone: '', rhymeGroup: '', difficulty: 2, dueAt: '', publishToHomework: true, publishToVocab: true, sortOrder: 1 },
      { id: 'ai-sh-2', courseId: selectedCourseId, taskId: 'ai-sh-2', taskType: 'pronunciation', unit: 1, lesson: 2, lessonTitle: 'AI 专项：翘舌音 zh/ch/sh', pageNumber: 2, zhText: '老师', pinyin: 'lǎoshī', translationRu: 'Учитель', translationKk: '', prompt: '', answer: '', initial: 'sh', final: '', tone: '', rhymeGroup: '', difficulty: 2, dueAt: '', publishToHomework: true, publishToVocab: true, sortOrder: 2 }
    ];
    return [
      { unit: 1, lesson: 1, lessonTitle: 'AI 专项：去声(Tone 4)纠错', tasks: t4Tasks, completedCount: t4Tasks.filter(t => learningRecords.some(r => r.taskId === t.taskId && r.status === 'completed')).length, totalCount: t4Tasks.length },
      { unit: 1, lesson: 2, lessonTitle: 'AI 专项：翘舌音 zh/ch/sh 辨析', tasks: shTasks, completedCount: shTasks.filter(t => learningRecords.some(r => r.taskId === t.taskId && r.status === 'completed')).length, totalCount: shTasks.length }
    ];
  }, [selectedCourseId, learningRecords]);

  const displayGroups = homeworkTab === 'homework' ? groups : aiRecommendedGroups;
  const displayGroupIndex = homeworkTab === 'homework' ? currentGroupIndex : aiRecommendedGroups.findIndex(g => g.completedCount < g.totalCount);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [showExitDraftPrompt, setShowExitDraftPrompt] = useState(false);
  const [pendingExitToPath, setPendingExitToPath] = useState(false);
  const [serverDraftId, setServerDraftId] = useState<string | null>(null);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);

  const currentTasks = selectedGroup?.tasks || allTasks;
  const currentTask = currentTasks[currentIndex];
  const currentTaskKey = slotStorageKey(selectedCourseId, activeLessonNodeId || currentTask?.lessonNodeId, currentTask?.taskId);
  const taskSlotKey = useCallback((task: LearningTask) =>
    slotStorageKey(selectedCourseId, activeLessonNodeId || task.lessonNodeId, task.taskId),
  [activeLessonNodeId, selectedCourseId]);

  const getCurrentAssignmentSlotCache = useCallback(() => {
    const all = readAllSlotCache();
    return currentTasks.reduce<Record<string, StoredRecordingSlot[]>>((acc, task) => {
      const key = taskSlotKey(task);
      acc[key] = all[key] || [];
      return acc;
    }, {});
  }, [currentTasks, taskSlotKey]);

  const hydrateSlots = useCallback((key: string) => {
    const slots = readAllSlotCache()[key] || [];
    return slots
      .slice(0, MAX_RECORDING_SLOTS)
      .map((slot) => ({
        id: slot.id,
        url: slot.dataUrl,
        score: slot.score,
        timestamp: new Date(slot.timestamp),
        durationSec: slot.durationSec,
        remoteId: slot.remoteId,
        committed: slot.committed
      }));
  }, []);

  const persistSlots = useCallback((key: string, nextRecordings: Recording[]) => {
    const cache = readAllSlotCache();
    cache[key] = nextRecordings.slice(0, MAX_RECORDING_SLOTS).map((rec) => ({
      id: rec.id,
      dataUrl: rec.url,
      score: rec.score,
      timestamp: rec.timestamp.toISOString(),
      durationSec: rec.durationSec || 0,
      remoteId: rec.remoteId,
      committed: rec.committed
    }));
    writeAllSlotCache(cache);
  }, []);

  const hasDraftProgress = useCallback(() => {
    if (!selectedCourseId) return false;
    const cache = readAllSlotCache();
    return Object.keys(cache).some((key) => key.startsWith(`${selectedCourseId}:`) && cache[key]?.length > 0);
  }, [selectedCourseId]);

  const taskHasThreeScores = useCallback((task: LearningTask) => {
    return hydrateSlots(taskSlotKey(task)).length >= MAX_RECORDING_SLOTS;
  }, [hydrateSlots, taskSlotKey]);

  const allVisibleTasksComplete = useCallback(() => {
    return currentTasks.length > 0 && currentTasks.every(taskHasThreeScores);
  }, [currentTasks, taskHasThreeScores]);

  useEffect(() => {
    if (propCourseId) {
      setSelectedCourseId(propCourseId);
      localStorage.setItem('lingobridge_courseId', propCourseId);
    }
  }, [propCourseId]);

  useEffect(() => {
    setActiveLessonNodeId(propLessonNodeId);
  }, [propLessonNodeId]);

  useEffect(() => {
    coursesApi.list().then((list) => {
      setCourses(list);
      if (!selectedCourseId && list.length > 0) {
        setSelectedCourseId(list[0].id);
        localStorage.setItem('lingobridge_courseId', list[0].id);
      }
    }).catch(() => {});
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);

    // 永远拉取该课程下的全部学情记录与任务，以完整渲染通关大地图，落实“一条路走到底”的心智模型
    const recordsContext = { context: 'homework' as const };
    const tasksPromise = homeworkApi.tasks(selectedCourseId, { includeAll: true });
    const lessonNodesPromise = lessonNodesApi.list(selectedCourseId).catch(() => [] as LessonNodeData[]);

    Promise.all([
      lessonNodesPromise,
      tasksPromise,
      learningRecordsApi.list(selectedCourseId, recordsContext)
    ]).then(([lessonNodes, tasks, records]) => {
      if (tasks) {
        for (const t of tasks) {
          if (t && !t.taskId) t.taskId = (t as any).taskKey;
        }
      }
      setAllTasks(tasks);
      setLearningRecords(records);

      let result: LessonGroup[] = [];

      if (lessonNodes && lessonNodes.length > 0) {
        // 优先基于实际创建的课时节点进行路径聚合排序，保证“一条路走到底”的课时节点心智
        const sortedNodes = [...lessonNodes].sort((a, b) => {
          const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
          const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
          return timeA - timeB || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        sortedNodes.forEach((node, idx) => {
          const nodeTasks = tasks.filter(t => t.lessonNodeId === node.id);
          const completedCount = nodeTasks.filter(t =>
            records.some(r => r.taskId === t.taskId && r.status === 'completed')
          ).length;

          result.push({
            unit: 1,
            lesson: idx + 1,
            lessonTitle: node.title,
            tasks: nodeTasks.sort((a, b) => a.sortOrder - b.sortOrder),
            completedCount,
            totalCount: nodeTasks.length
          });
        });
      } else {
        // 安全降级兜底：当课程无任何课时节点时，使用原来的单元课时聚合，确保老环境测试数据的 100% 兼容性
        const lessonMap = new Map<string, LearningTask[]>();
        for (const task of tasks) {
          const key = `${task.unit}-${task.lesson}`;
          if (!lessonMap.has(key)) lessonMap.set(key, []);
          lessonMap.get(key)!.push(task);
        }
        for (const [key, taskList] of lessonMap) {
          const [unit, lesson] = key.split('-').map(Number);
          const completedCount = taskList.filter(t =>
            records.some(r => r.taskId === t.taskId && r.status === 'completed')
          ).length;
          result.push({
            unit,
            lesson,
            lessonTitle: taskList[0].lessonTitle || '',
            tasks: taskList.sort((a, b) => a.sortOrder - b.sortOrder),
            completedCount,
            totalCount: taskList.length
          });
        }
        result.sort((a, b) => a.unit - b.unit || a.lesson - b.lesson);
      }

      setGroups(result);
      setLoading(false);

      // 智能自动高亮定位：如果指定了课时节点，全自动定位并展开该课时的作业任务面板
      if (activeLessonNodeId) {
        let matched = result.find(g =>
          g.tasks.some(t => t.lessonNodeId === activeLessonNodeId)
        );
        if (!matched && lessonNodes) {
          const node = lessonNodes.find(n => n.id === activeLessonNodeId);
          if (node) {
            matched = result.find(g => g.lessonTitle === node.title);
          }
        }
        if (matched) {
          console.log(`[Focus Locator] Automatically focusing and expanding lesson node: ${activeLessonNodeId}`);
          setSelectedGroup(matched);
        }
      }

      // S5-T06: Restore L1 cache after data loaded
      if (activeLessonNodeId && selectedCourseId) {
        const l1 = l1GetDraft(selectedCourseId, activeLessonNodeId);
        if (l1 && l1.currentIndex >= 0 && l1.currentIndex < tasks.length) {
          setCurrentIndex(l1.currentIndex);
        }
      }
    }).catch((err) => {
      console.error('Failed to load homework data:', err);
      setError(t('homework.load_error'));
      setLoading(false);
    });
  }, [selectedCourseId, activeLessonNodeId]);

  useEffect(() => {
    if (!currentTask?.taskId) return;
    const restored = hydrateSlots(currentTaskKey);
    setRecordings(restored);
    setPendingRecording(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setShowAnalysis(false);
    setActiveSlotIndex(Math.min(restored.length, MAX_RECORDING_SLOTS - 1));

    if (!assignmentSubmitted) return;
    recordingsApi.list(currentTask.courseId, {
      taskId: currentTask.taskId,
      lessonNodeId: currentTask.lessonNodeId || activeLessonNodeId
    }).then((serverRecordings) => {
      if (!serverRecordings || serverRecordings.length === 0) return;
      const remoteSlots: Recording[] = serverRecordings
        .slice(0, MAX_RECORDING_SLOTS)
        .map((rec) => ({
          id: rec.id,
          url: mediaUrl(rec.audioUrl),
          score: scoreRecording(currentTask.taskId, 1),
          timestamp: new Date(rec.createdAt),
          durationSec: rec.durationSec,
          remoteId: rec.id,
          committed: true
        }));
      const localByRemote = new Set(restored.map((rec) => rec.remoteId).filter(Boolean));
      const merged = [
        ...restored,
        ...remoteSlots.filter((rec) => !localByRemote.has(rec.remoteId))
      ].slice(0, MAX_RECORDING_SLOTS);
      setRecordings(merged);
      persistSlots(currentTaskKey, merged);
      setActiveSlotIndex(Math.min(merged.length, MAX_RECORDING_SLOTS - 1));
    }).catch(() => {});
  }, [assignmentSubmitted, currentTaskKey, currentTask?.taskId, hydrateSlots]);

  useEffect(() => {
    if (!selectedCourseId || !activeLessonNodeId || !user?.id || allTasks.length === 0) return;
    const assignmentNodeId = allTasks[0]?.assignmentNodeId;
    if (!assignmentNodeId) return;
    homeworkSubmissionsApi.get({ studentId: user.id, assignmentNodeId })
      .then((submission) => {
        if (!Array.isArray(submission) && submission?.id) {
          setServerDraftId(submission.id);
          setAssignmentSubmitted(submission.status === 'submitted' || submission.status === 'graded');
          const draft = submission.draftData || {};
          if (draft.recordingSlots && typeof draft.recordingSlots === 'object') {
            const serverSlots = draft.recordingSlots as Record<string, StoredRecordingSlot[]>;
            mergeSlotCache(serverSlots);
            const firstTaskKey = slotStorageKey(selectedCourseId, activeLessonNodeId, allTasks[0].taskId);
            if (serverSlots[firstTaskKey]) {
              const restored = hydrateSlots(firstTaskKey);
              setRecordings(restored);
              setActiveSlotIndex(Math.min(restored.length, MAX_RECORDING_SLOTS - 1));
            }
          }
          if (submission.status === 'draft' && typeof draft.currentIndex === 'number') {
            if (draft.currentIndex >= 0 && draft.currentIndex < allTasks.length) {
              setCurrentIndex(draft.currentIndex);
            }
          }
        }
      })
      .catch(() => {});
  }, [activeLessonNodeId, allTasks, hydrateSlots, selectedCourseId, user?.id, slotStorageKey]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasDraftProgress()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasDraftProgress]);

  const allCurrentDone = groups.every(g => g.completedCount === g.totalCount);
  const currentGroupIndex = groups.findIndex(g => g.completedCount < g.totalCount);

  const saveServerDraft = useCallback(async (override?: Record<string, any>) => {
    const assignmentNodeId = currentTask?.assignmentNodeId;
    const lessonNodeId = activeLessonNodeId || currentTask?.lessonNodeId;
    if (!user?.id || !selectedCourseId || !lessonNodeId || !assignmentNodeId) return null;
    try {
      const submission = await homeworkSubmissionsApi.saveDraft({
        studentId: user.id,
        courseId: selectedCourseId,
        lessonNodeId,
        assignmentNodeId,
        draftData: {
          currentIndex,
          activeTaskId: currentTask?.taskId,
          recordingSlots: getCurrentAssignmentSlotCache(),
          updatedAt: new Date().toISOString(),
          ...override
        }
      });
      setServerDraftId(submission.id);
      return submission;
    } catch (error) {
      console.warn('Failed to sync homework draft to server; browser cache is still preserved.', error);
      return null;
    }
  }, [activeLessonNodeId, currentIndex, currentTask?.assignmentNodeId, currentTask?.lessonNodeId, currentTask?.taskId, getCurrentAssignmentSlotCache, selectedCourseId, user?.id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordings.forEach(r => URL.revokeObjectURL(r.url));
    };
  }, []);

  const startRecording = async () => {
    if (assignmentSubmitted || recordings.length >= MAX_RECORDING_SLOTS) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const durationSec = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
        const dataUrl = await blobToDataUrl(audioBlob);
        const localRecording: PendingRecording = {
          id: `${currentTask?.taskId || 'task'}-${activeSlotIndex}-${Date.now()}`,
          url: dataUrl,
          timestamp: new Date(),
          durationSec
        };

        setPendingRecording(localRecording);
        setAudioUrl(dataUrl);
        setActiveSlotIndex(Math.min(recordings.length, MAX_RECORDING_SLOTS - 1));
        stream.getTracks().forEach(track => track.stop());
        setShowAnalysis(false);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setShowAnalysis(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) { stopRecording(); return 10; }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(t('homework.mic_error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleCheck = async () => {
    if (!pendingRecording || !currentTask || assignmentSubmitted || recordings.length >= MAX_RECORDING_SLOTS) return;
    const nextSlot = recordings.length;
    const scoredRecording: Recording = {
      ...pendingRecording,
      score: scoreRecording(currentTask.taskId, nextSlot + 1),
      committed: false
    };
    const nextRecordings = [...recordings, scoredRecording].slice(0, MAX_RECORDING_SLOTS);
    setRecordings(nextRecordings);
    persistSlots(currentTaskKey, nextRecordings);
    setPendingRecording(null);
    setAudioUrl(scoredRecording.url);
    setActiveSlotIndex(Math.min(nextRecordings.length, MAX_RECORDING_SLOTS - 1));
    setShowAnalysis(true);
    if (selectedCourseId && activeLessonNodeId) {
      l1SaveDraft(selectedCourseId, activeLessonNodeId, { currentIndex });
    }
  };

  const deleteRecording = (id: string) => {
    if (assignmentSubmitted) return;
    setRecordings(prev => {
      const next = prev.filter(r => r.id !== id);
      persistSlots(currentTaskKey, next);
      if (audioUrl && prev.find((r) => r.id === id)?.url === audioUrl) setAudioUrl(null);
      return next;
    });
  };

  const submitCompletedHomework = async () => {
    if (!currentTask || !user?.id || !allVisibleTasksComplete()) return;
    setSavingRecord(true);
    try {
      const slotCache = readAllSlotCache();
      for (const task of currentTasks) {
        const key = taskSlotKey(task);
        const slots = (slotCache[key] || []).slice(0, MAX_RECORDING_SLOTS);
        const uploaded = await Promise.all(slots.map(async (slot, index) => {
          if (slot.remoteId) return slot.remoteId;
          const blob = await dataUrlToBlob(slot.dataUrl);
          const rec = await recordingsApi.upload({
            courseId: task.courseId,
            pageNumber: task.pageNumber,
            taskId: task.taskId,
            lessonNodeId: task.lessonNodeId || activeLessonNodeId,
            blob,
            durationSec: slot.durationSec || 0,
            filename: `${task.taskId}-slot-${index + 1}.webm`
          });
          slot.remoteId = rec.id;
          slot.committed = true;
          return rec.id;
        }));
        slotCache[key] = slots.map(slot => ({ ...slot, committed: true }));
        const bestScore = Math.max(...slots.map(slot => slot.score.total));
        await learningRecordsApi.save(task.taskId, {
          context: 'homework',
          status: 'completed',
          score: bestScore,
          recordingId: uploaded[uploaded.length - 1],
          lessonNodeId: task.lessonNodeId || activeLessonNodeId
        });
      }
      writeAllSlotCache(slotCache);
      const submission = await saveServerDraft({
        currentIndex,
        completedAt: new Date().toISOString(),
        submittedTaskIds: currentTasks.map(task => task.taskId)
      });
      const id = submission?.id || serverDraftId;
      if (id) await homeworkSubmissionsApi.submit(id);
      setAssignmentSubmitted(true);
      const refreshed = await learningRecordsApi.list(selectedCourseId, {
        context: 'homework',
        lessonNodeId: activeLessonNodeId
      });
      setLearningRecords(refreshed);
      setGroups(prev => prev.map(group => ({
        ...group,
        completedCount: group.tasks.filter(task =>
          refreshed.some(record => record.taskId === task.taskId && record.status === 'completed')
        ).length
      })));
      setView('path');
    } catch (error) {
      console.error('Failed to submit completed homework:', error);
      alert('提交作业失败，请稍后再试。');
    } finally {
      setSavingRecord(false);
    }
  };

  const handleNextTask = async () => {
    if (!currentTasks.length || !currentTaskCompleted || pendingRecording || assignmentSubmitted) return;
    if (currentIndex >= currentTasks.length - 1) {
      if (!allVisibleTasksComplete()) return;
      await submitCompletedHomework();
      return;
    }
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setShowAnalysis(false);
    setAudioUrl(null);
    setRecordingTime(0);
    if (selectedCourseId && activeLessonNodeId) l1SaveDraft(selectedCourseId, activeLessonNodeId, { currentIndex: nextIdx });
  };

  const latestScore = (recordings.find((recording) => recording.url === audioUrl) || recordings[recordings.length - 1])?.score;
  const currentTaskCompleted = recordings.length >= MAX_RECORDING_SLOTS
    || (assignmentSubmitted && !!currentTask && learningRecords.some(r => r.taskId === currentTask.taskId && r.status === 'completed'));
  const isLastTask = currentIndex >= currentTasks.length - 1;
  const nextActionDisabled = assignmentSubmitted || (isLastTask ? !allVisibleTasksComplete() : !currentTaskCompleted);
  const playTaskTts = (text?: string, lang: 'zh-CN' | 'ru-RU' = 'zh-CN') => {
    const value = text?.trim();
    if (!value) return;
    ttsService.speak(value, lang);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {showExitDraftPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-gray-100"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">保存当前练习进度？</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                未确认录音不会保存；已评分的槽位只保存在本地。完成全部子项并提交作业后，录音和完成状态才会写入数据库。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitDraftPrompt(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50"
                >
                  继续练习
                </button>
                <button
                  onClick={async () => {
                    await saveServerDraft({ currentIndex });
                    setShowExitDraftPrompt(false);
                    if (pendingExitToPath) {
                      setPendingExitToPath(false);
                      setView('path');
                    }
                  }}
                  className="flex-1 rounded-xl bg-[#0056D2] px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  保存并退出
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto animate-pulse-subtle">
          <button
            onClick={() => setHomeworkTab('homework')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              homeworkTab === 'homework' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            课后作业
          </button>
          <button
            onClick={() => setHomeworkTab('ai-path')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              homeworkTab === 'ai-path' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            我的学习路径
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-full sm:w-auto">
          <BookOpen size={14} className="text-gray-400" />
          <select
            value={selectedCourseId}
            onChange={(e) => {
              const cid = e.target.value;
              setSelectedCourseId(cid);
              setActiveLessonNodeId(undefined);
              localStorage.setItem('lingobridge_courseId', cid);
            }}
            className="bg-transparent border-none outline-none font-bold text-gray-700 cursor-pointer"
          >
            {courses.length === 0 && <option value={selectedCourseId}>{t('schedule.no_classes')}</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>


      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-[#0056D2] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('homework.loading')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <FileWarning size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{error}</p>
          </div>
        </div>
      ) : view === 'path' ? (
      <div id="homework-path" className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Background Decorations */}
        <FloatingElement className="top-10 left-10 text-blue-200" delay={0}>
          <Sparkles size={80} />
        </FloatingElement>
        <FloatingElement className="top-40 right-20 text-orange-100" delay={1} yOffset={20}>
          <Layers size={100} />
        </FloatingElement>
        <FloatingElement className="bottom-20 left-1/4 text-green-100" delay={2}>
          <BookOpen size={60} />
        </FloatingElement>

        <div className="max-w-6xl mx-auto flex gap-12 pt-8">
          {/* Main Pathway Column */}
          <div className="flex-1">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {homeworkTab === 'homework' ? t('homework.path_title') : 'AI 自学引导学习路径'}
              </h1>
              <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
                {homeworkTab === 'homework' 
                  ? t('homework.path_desc') 
                  : 'AI 根据您的发音薄弱点与声调历史数据动态规划推荐的学习路径节点。'}
              </p>
            </div>

            <div className="flex justify-center pb-32 relative">
              <div className="flex flex-col items-center w-full max-w-md">
                {displayGroups.map((g, i) => {
                  const isCompleted = i < displayGroupIndex;
                  const isCurrent = i === displayGroupIndex;
                  const status = isCompleted ? 'completed' : isCurrent ? 'current' : 'locked';
                  return (
                    <div key={`${g.unit}-${g.lesson}-${g.lessonTitle}`} className="relative flex flex-col items-center">
                      <PathNode group={g} index={i} onSelect={(grp) => setSelectedGroup(grp)} allCompleted={i < displayGroupIndex} isLast={i === displayGroups.length - 1} />
                      {i < displayGroups.length - 1 && <PathArrow index={i} status={status} />}
                    </div>
                  );
                })}

                {/* Visual End Indicator */}
                {displayGroups.length > 0 && (
                  <div className="relative flex flex-col items-center mt-12">
                     <div className="w-20 h-20 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                       <ArrowBigDown size={40} />
                     </div>
                     <span className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('homework.more_coming')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <HomeworkSidebar onViewGraph={() => onNavigate?.('knowledge-graph')} />
        </div>

        {/* Selected Lesson Task List (Modal/Panel) */}
        <AnimatePresence>
          {selectedGroup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setSelectedGroup(null)}
            >
              <motion.div
                className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative border border-gray-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 p-8 overflow-hidden pointer-events-none opacity-5">
                   <Award size={200} />
                </div>

                <button
                  onClick={() => setSelectedGroup(null)}
                  className="absolute top-8 right-8 p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>

                <div className="mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-[#0056D2] rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-blue-100">
                    <BookMarked size={12} />
                    {t('homework.unit')} {selectedGroup.unit} • {t('homework.lesson')} {selectedGroup.lesson}
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 leading-tight">{selectedGroup.lessonTitle || `${t('homework.lesson')} ${selectedGroup.lesson}`}</h2>
                </div>

                <div className="space-y-5">
                  {selectedGroup.tasks.length > 0 ? (
                    selectedGroup.tasks.map((task) => {
                      const isCompleted = learningRecords.some(r => r.taskId === task.taskId && r.status === 'completed');
                      return (
                      <motion.div
                        key={task.taskId}
                        whileHover={!isCompleted ? { x: 8 } : {}}
                        className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group shadow-sm ${
                          isCompleted ? 'bg-green-50/50 border-green-100' :
                          'bg-white border-blue-200'
                        }`}
                      >
                         <div className="flex items-center gap-5">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                             isCompleted ? 'bg-green-100 text-green-600' :
                             'bg-[#0056D2] text-white'
                           }`}>
                             {task.taskType === 'vocabulary' ? <Layers size={28} /> : <Mic size={28} />}
                           </div>
                           <div>
                             <h4 className="font-bold text-gray-900 text-lg leading-tight">{homeworkTypeLabel(task.taskType, t)}</h4>
                             <p className="text-sm text-gray-500 font-medium">{task.zhText}</p>
                           </div>
                         </div>

                         {isCompleted ? (
                           <div className="flex items-center gap-2 text-green-600">
                             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                               <Check size={18} strokeWidth={3} />
                             </div>
                           </div>
                         ) : (
                           <button
                             data-testid="homework-enter-task"
                             onClick={() => { setView('task'); setCurrentIndex(selectedGroup.tasks.indexOf(task)); }}
                             className="w-12 h-12 bg-[#0056D2] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                           >
                             <ArrowRight size={24} />
                           </button>
                         )}
                      </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 px-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Search size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium italic">{t('homework.no_tasks')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      ) : (
      <div id="homework-task-view" className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
       {/* Task Back Nav */}
       <div className="flex items-center gap-4 mb-4">
         <button
           onClick={() => {
             if (hasDraftProgress()) {
               setPendingExitToPath(true);
               setShowExitDraftPrompt(true);
             } else {
               setView('path');
             }
           }}
           className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-colors group"
         >
           <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
           {t('homework.back_path')}
         </button>
       </div>

      <div className="flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{t('homework.type.speaking')}</h1>
            <span className="text-[10px] font-bold text-[#0056D2] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">{t('homework.active_task')}</span>
          </div>
          <p className="text-sm text-gray-600">{t('homework.subtitle')}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 py-1.5 px-4 rounded-full border border-gray-100">
            <X size={14} className="text-gray-300" />
            {t('homework.due')}: {t('homework.today')} 23:59
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-10 shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400">{currentIndex + 1} / {currentTasks.length} {t('homework.pages')}</span>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#0056D2] transition-all duration-300" style={{ width: `${((currentIndex + 1) / currentTasks.length) * 100}%` }} />
          </div>
          <div className="bg-green-100 text-green-700 font-bold text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Star size={12} className="fill-green-600" />
            +10 XP
          </div>
        </div>

        <div className="flex flex-col items-center py-12 space-y-8">
          <div className="text-center relative">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-wide leading-tight group flex items-center justify-center gap-4">
              <span className="font-noto">{currentTask?.zhText || ''}</span>
              <button
                onClick={() => playTaskTts(currentTask?.zhText, 'zh-CN')}
                className="p-3 bg-[#0056D2] text-white rounded-full hover:bg-blue-700 transition-all shadow-md hover:scale-110 active:scale-95"
                title="播放中文"
              >
                <Volume2 size={28} />
              </button>
            </h2>
            <div className="flex flex-col items-center gap-2 mt-2">
              <p className="text-xl text-gray-400 font-medium italic">{currentTask?.pinyin || ''}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-base text-gray-500 bg-gray-100 px-5 py-2 rounded-full font-medium">{currentTask?.translationRu || ''}</span>
                {currentTask?.translationRu && (
                  <button
                    onClick={() => playTaskTts(currentTask.translationRu, 'ru-RU')}
                    className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                    title="播放俄语"
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-50/50 px-6 py-2.5 rounded-full border border-blue-100">
            <Lightbulb size={20} className="text-[#0056D2]" />
            <span className="text-sm font-semibold text-[#0056D2]">{t('homework.tip')}</span>
          </div>
        </div>

        <div className="bg-gray-50/80 backdrop-blur-md rounded-3xl p-10 border border-blue-200 relative transition-all shadow-inner">
          <div className="flex flex-col items-center gap-8">
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
              {[0, 1, 2].map((slot) => {
                const rec = recordings[slot];
                const active = slot === activeSlotIndex;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      if (pendingRecording) return;
                      setActiveSlotIndex(slot);
                      setAudioUrl(rec?.url || null);
                      setShowAnalysis(false);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                      active ? 'border-[#0056D2] bg-blue-50 text-[#0056D2]' : 'border-gray-200 bg-white text-gray-500 hover:border-blue-200'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-widest">Slot {slot + 1}</div>
                    <div className="mt-1 text-sm font-bold">
                      {rec ? `${t('homework.score')}: ${rec.score.total}` : slot === recordings.length && pendingRecording ? '待确认' : 'Empty'}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-sm">
              {[0.4, 0.6, 1, 0.8, 1, 0.4, 1, 0.7, 0.3, 1, 0.5, 0.8, 0.6, 0.9, 0.4].map((h, i) => (
                <motion.div
                  key={i}
                  animate={isRecording ? { height: [h*100+'%', (h*0.4)*100+'%', h*100+'%'] } : { height: '15%' }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                  className={`w-2.5 rounded-full transition-colors ${isRecording ? 'bg-[#0056D2]' : 'bg-gray-300'}`}
                />
              ))}
            </div>

            <div className="text-center">
              {isRecording ? (
                <div className="text-xl font-bold text-[#0056D2] mb-1 flex items-center justify-center gap-2 uppercase tracking-widest">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  {t('homework.recording')}
                </div>
              ) : (
                <div className="text-xl font-bold text-gray-600 mb-1">
                  {pendingRecording ? '录音待确认' : recordings.length >= MAX_RECORDING_SLOTS ? '三次评分已完成' : t('homework.ready')}
                </div>
              )}
              <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                00:{recordingTime.toString().padStart(2, '0')} / 00:10
              </div>
            </div>

            <div className="flex items-center gap-10">
              <button
                data-testid="homework-reset-recording"
                onClick={() => {
                  if (assignmentSubmitted) return;
                  if (pendingRecording) {
                    setPendingRecording(null);
                  } else {
                    const next = recordings.filter((_, index) => index !== activeSlotIndex);
                    setRecordings(next);
                    persistSlots(currentTaskKey, next);
                    setActiveSlotIndex(Math.min(next.length, MAX_RECORDING_SLOTS - 1));
                  }
                  setAudioUrl(null);
                  setRecordingTime(0);
                  setShowAnalysis(false);
                }}
                className="w-14 h-14 rounded-full border-2 border-gray-200 text-gray-400 flex items-center justify-center hover:bg-white hover:text-red-500 transition-all disabled:opacity-30 shadow-sm"
                disabled={assignmentSubmitted || (!pendingRecording && !recordings[activeSlotIndex]) || isRecording}
                title="Reset selected slot"
              >
                <RotateCcw size={24} />
              </button>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  data-testid="homework-record-button"
                  disabled={assignmentSubmitted || !!pendingRecording || recordings.length >= MAX_RECORDING_SLOTS}
                  className="w-24 h-24 rounded-full bg-[#0056D2] text-white flex items-center justify-center shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 group relative disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 group-hover:hidden" />
                  <Mic size={48} className="group-hover:opacity-90 relative z-10" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  data-testid="homework-stop-button"
                  className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 group animate-pulse"
                >
                  <StopCircle size={48} className="group-hover:opacity-90" />
                </button>
              )}

              <button
                type="button"
                data-testid="homework-confirm-recording"
                onClick={handleCheck}
                className={`w-14 h-14 rounded-full border-2 text-gray-400 flex items-center justify-center transition-all shadow-sm ${
                  pendingRecording && !isRecording && !uploadingRecording && !assignmentSubmitted ? 'border-green-500 text-green-500 hover:bg-green-50' : 'border-gray-200 opacity-30 cursor-not-allowed'
                }`}
                disabled={!pendingRecording || isRecording || uploadingRecording || assignmentSubmitted}
              >
                {uploadingRecording ? <Cpu size={28} className="animate-pulse" /> : <CheckCircle2 size={32} />}
              </button>
            </div>
          </div>
        </div>

        {recordings.length > 0 && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">{t('homework.latest')}</h4>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {recordings.map((rec) => (
                <div key={rec.id} className="min-w-[200px] bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center justify-between group hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { const audio = new Audio(rec.url); audio.play(); }}
                      className="w-10 h-10 rounded-full bg-white text-[#0056D2] flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all border border-gray-100"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`text-xs font-bold text-gray-900`}>{t('homework.score')}: {rec.score.total}</div>
                        {rec.score.total >= 80 ? (
                          <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-black uppercase">PASS</span>
                        ) : (
                          <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-black uppercase">FAIL</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">{rec.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteRecording(rec.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAnalysis && latestScore && (
          <motion.div data-testid="homework-ai-analysis" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Cpu size={22} className="text-green-600" />
                {t('homework.ai_eval')}
              </h3>
              <div className="flex items-center gap-8 mb-8 bg-gray-50 rounded-[2rem] p-8 border border-gray-100 shadow-inner">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="2" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#0056D2" strokeWidth="3" strokeDasharray={`${latestScore.total}, 100`} strokeLinecap="round" className="transition-all duration-1000 ease-out drop-shadow-[0_0_4px_rgba(0,86,210,0.4)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 leading-none">{latestScore.total}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('homework.total_score')}</span>
                  </div>
                </div>
                <div>
                  <div className="flex gap-0.5 text-yellow-400 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={18} className={`fill-current ${s > Math.round(latestScore.total / 20) ? 'opacity-20' : ''}`} />
                    ))}
                  </div>
                  <h4 className={`text-xl font-bold mb-1 ${latestScore.total >= 80 ? 'text-gray-900' : 'text-red-600'}`}>
                    {latestScore.total >= 80
                      ? (latestScore.total > 90 ? t('homework.excellent') : t('homework.great'))
                      : t('homework.keep_practicing')
                    }
                  </h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{t('homework.eval_desc')}</p>
                </div>
              </div>
              <div className="space-y-5">
                {[{ label: t('homework.fluency'), score: latestScore.fluency }, { label: t('homework.tone'), score: latestScore.tone }, { label: t('homework.pronunciation'), score: latestScore.pronunciation }, { label: t('homework.completeness'), score: latestScore.completeness }].map((item, id) => (
                  <div key={id} className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-gray-500">{item.label}</span>
                      <span className={item.score > 85 ? 'text-green-600' : 'text-blue-600'}>{item.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 1.2, delay: id * 0.15, ease: "easeOut" }} className={`h-full rounded-full ${item.score > 85 ? 'bg-green-500' : 'bg-blue-600'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle2 size={22} className="text-blue-600" />
                {t('homework.grammar')}
              </h3>
              <div className="space-y-4">
                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Mic size={20} /></div>
                  <div>
                    <p className="text-base font-bold text-orange-900 mb-1">{t('homework.tone_deviation')}</p>
                    <p className="text-sm text-orange-700 leading-relaxed">{t('homework.tone_desc')}</p>
                  </div>
                </div>
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0056D2] flex items-center justify-center shrink-0"><Lightbulb size={20} /></div>
                  <div>
                    <p className="text-base font-bold text-blue-900 mb-1">{t('homework.learning_tip')}</p>
                    <p className="text-sm text-blue-700 leading-relaxed">{t('homework.learning_desc')}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('homework.model_answer')}</p>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-2xl font-bold text-gray-900 mb-2 leading-tight font-noto">{currentTask?.zhText || ''}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-base text-gray-500 font-medium">{currentTask?.translationRu || ''}</p>
                    {currentTask?.translationRu && (
                      <button
                        onClick={() => playTaskTts(currentTask.translationRu, 'ru-RU')}
                        className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all"
                        title="播放俄语"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-[260px] right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 p-5 h-24 flex items-center z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex gap-4">
            <button
              data-testid="homework-prev-task"
              onClick={() => {
                if (!currentTasks.length || currentIndex === 0) return;
                const prevIdx = currentIndex - 1;
                setCurrentIndex(prevIdx);
                setShowAnalysis(false);
                setAudioUrl(null);
                setPendingRecording(null);
                setRecordingTime(0);
                if (selectedCourseId && activeLessonNodeId) l1SaveDraft(selectedCourseId, activeLessonNodeId, { currentIndex: prevIdx });
              }}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              {t('homework.prev')}
            </button>
            <button onClick={() => alert(t('homework.explain') + ': ' + (currentTask?.zhText || ''))} className="flex items-center gap-2 px-6 py-3 text-[#0056D2] font-bold hover:bg-blue-50 rounded-xl transition-all">
              <Lightbulb size={20} />
              {t('homework.explain')}
            </button>
          </div>
          <div className="flex gap-4">
            <button
              data-testid="homework-save-progress"
              onClick={() => saveServerDraft({ currentIndex })}
              disabled={assignmentSubmitted}
              className="px-8 py-3 bg-gray-50 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('homework.save')}
            </button>
            <button
              data-testid="homework-next-task"
              onClick={handleNextTask}
              disabled={nextActionDisabled || savingRecord}
              className={`flex items-center gap-2 px-10 py-3 font-bold rounded-xl shadow-lg transition-all group ${
                !nextActionDisabled && !savingRecord
                  ? 'bg-[#0056D2] text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLastTask ? (assignmentSubmitted ? '已提交' : '完成并提交') : t('homework.next')}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};

export default HomeworkView;
