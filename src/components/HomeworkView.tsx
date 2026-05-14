import React, { useState, useEffect, useRef } from 'react';
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
import { ttsService } from '../services/ttsService.ts';

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

const MOCK_SENTENCES = [
  { zh: '这是我的妈妈，她是一名医生。', pinyin: 'Zhè shì wǒ de māma, tā shì yī míng yīshēng.', ru: 'Это моя мама, она врач.' },
  { zh: '我喜欢学习汉语。', pinyin: 'Wǒ xǐhuān xuéxí Hànyǔ.', ru: 'Мне нравится изучать китайский язык.' },
  { zh: '明天天气很好。', pinyin: 'Míngtiān tiānqì hěn hǎo.', ru: 'Завтра будет хорошая погода.' },
  { zh: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', ru: 'Как тебя зовут?' },
  { zh: '很高兴认识你。', pinyin: 'Hěn gāoxìng rènshi nǐ.', ru: 'Рад познакомиться.' },
];

interface Assignment {
  id: string;
  type: 'vocab' | 'speaking' | 'reading';
  title: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

interface CurriculumNode {
  id: string;
  unit: number;
  lesson: number;
  title: string;
  assignments: Assignment[];
  status: 'completed' | 'current' | 'locked';
}

const CURRICULUM_DATA: CurriculumNode[] = [
  {
    id: 'n1',
    unit: 1,
    lesson: 1,
    title: 'greetings_basics',
    status: 'completed',
    assignments: [
      { id: 'a1', type: 'vocab', title: 'lesson_greet', isCompleted: true },
      { id: 'a2', type: 'speaking', title: 'lesson_intro', isCompleted: true },
    ]
  },
  {
    id: 'n2',
    unit: 1,
    lesson: 2,
    title: 'family_jobs',
    status: 'current',
    assignments: [
      { id: 'a3', type: 'vocab', title: 'lesson_family', isCompleted: true },
      { id: 'a4', type: 'speaking', title: 'lesson_mom', isCompleted: false, isCurrent: true },
      { id: 'a5', type: 'reading', title: 'lesson_family_para', isCompleted: false },
    ]
  },
  {
    id: 'n3',
    unit: 1,
    lesson: 3,
    title: 'daily_routine',
    status: 'locked',
    assignments: [
      { id: 'a6', type: 'vocab', title: 'lesson_time', isCompleted: false },
      { id: 'a7', type: 'speaking', title: 'lesson_schedule', isCompleted: false },
    ]
  },
  {
    id: 'n4',
    unit: 2,
    lesson: 1,
    title: 'shopping',
    status: 'locked',
    assignments: []
  }
];

const PathNode = ({ node, index, onSelect }: { node: CurriculumNode, index: number, onSelect: (node: CurriculumNode) => void, key?: any }) => {
  const { t } = useLanguage();
  const isLocked = node.status === 'locked';
  const isCompleted = node.status === 'completed';
  const isCurrent = node.status === 'current';

  return (
    <div 
      className="relative flex flex-col items-center mb-32 last:mb-0"
    >
      <motion.button
        whileHover={!isLocked ? { scale: 1.1, y: -5 } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        onClick={() => !isLocked && onSelect(node)}
        className={`w-28 h-28 rounded-full flex items-center justify-center relative shadow-2xl border-b-[10px] transition-all group ${
          isCompleted ? 'bg-green-500 border-green-700' : 
          isCurrent ? 'bg-[#0056D2] border-[#003B91] ring-8 ring-blue-100 ring-offset-0' : 
          'bg-gray-200 border-gray-400 opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="text-white z-10">
          {isCompleted ? <Check size={40} strokeWidth={3} /> : isCurrent ? <Star size={40} className="fill-white" /> : <Lock size={32} />}
        </div>
        
        {/* Connection Arrow */}
        {index < CURRICULUM_DATA.length - 1 && (
           <PathArrow index={index} status={node.status} />
        )}

        {/* Shine effect for active node */}
        {isCurrent && (
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white rounded-full pointer-events-none"
          />
        )}
      </motion.button>
      
      <div className="mt-6 text-center w-48">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mb-2">
          {t('homework.unit')} {node.unit} • {t('homework.lesson')} {node.lesson}
        </div>
        <h4 className={`text-base font-bold leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>{t(`homework.${node.title}`)}</h4>
      </div>
    </div>
  );
};

const HomeworkSidebar = () => {
  const { t } = useLanguage();
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

        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 group hover:border-purple-200 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Network size={24} />
            </div>
            <h3 className="font-bold text-lg text-gray-900">{t('homework.stats.mindmap')}</h3>
            <ChevronRight size={20} className="ml-auto text-gray-300 group-hover:text-purple-600 transition-colors" />
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
}

const HomeworkView = () => {
  const { t } = useLanguage();
  const [view, setView] = useState<'path' | 'task'>('path');
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  
  // Task state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentSentence = MOCK_SENTENCES[currentIndex];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordings.forEach(r => URL.revokeObjectURL(r.url));
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setShowAnalysis(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) { sleep(100).then(() => stopRecording()); return 10; }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record.");
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleCheck = () => {
    if (!audioUrl) return;
    // Set threshold of 80 for passing
    const totalScore = Math.floor(Math.random() * 35) + 65;
    const score = {
      total: totalScore,
      fluency: Math.floor(Math.random() * 35) + 65,
      tone: Math.floor(Math.random() * 35) + 65,
      pronunciation: Math.floor(Math.random() * 35) + 65,
      completeness: 100,
    };
    const newRecording: Recording = { id: Date.now().toString(), url: audioUrl, score, timestamp: new Date() };
    setRecordings(prev => [newRecording, ...prev].slice(0, 3));
    setShowAnalysis(true);
    setAudioUrl(null);
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => {
      const record = prev.find(r => r.id === id);
      if (record) URL.revokeObjectURL(record.url);
      return prev.filter(r => r.id !== id);
    });
  };

  const latestScore = recordings[0]?.score;

  if (view === 'path') {
    return (
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
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('homework.path_title')}</h1>
              <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">{t('homework.path_desc')}</p>
            </div>

            <div className="flex justify-center pb-32 relative">
              <div className="flex flex-col items-center w-full max-w-md">
                {CURRICULUM_DATA.map((node, i) => (
                  <PathNode key={node.id} node={node} index={i} onSelect={(n) => setSelectedNode(n)} />
                ))}
                
                {/* Visual End Indicator */}
                <div className="relative flex flex-col items-center mt-12">
                   <div className="w-20 h-20 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                     <ArrowBigDown size={40} />
                   </div>
                   <span className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('homework.more_coming')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <HomeworkSidebar />
        </div>

        {/* Selected Lesson Assignment List (Modal/Panel) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setSelectedNode(null)}
            >
              <motion.div 
                className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative border border-gray-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 p-8 overflow-hidden pointer-events-none opacity-5">
                   <Award size={200} />
                </div>

                <button 
                  onClick={() => setSelectedNode(null)}
                  className="absolute top-8 right-8 p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>

                <div className="mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-[#0056D2] rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-blue-100">
                    <BookMarked size={12} />
                    {t('homework.unit')} {selectedNode.unit} • {t('homework.lesson')} {selectedNode.lesson}
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 leading-tight">{t(`homework.${selectedNode.title}`)}</h2>
                </div>

                <div className="space-y-5">
                  {selectedNode.assignments.length > 0 ? (
                    selectedNode.assignments.map((assignment) => (
                      <motion.div 
                        key={assignment.id}
                        whileHover={!assignment.isCompleted && assignment.isCurrent ? { x: 8 } : {}}
                        className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group shadow-sm ${
                          assignment.isCompleted ? 'bg-green-50/50 border-green-100' : 
                          assignment.isCurrent ? 'bg-white border-blue-200' : 'bg-gray-50/50 border-gray-100 opacity-60'
                        }`}
                      >
                         <div className="flex items-center gap-5">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                             assignment.isCompleted ? 'bg-green-100 text-green-600' : 
                             assignment.isCurrent ? 'bg-[#0056D2] text-white' : 'bg-gray-100 text-gray-400'
                           }`}>
                             {assignment.type === 'vocab' && <Layers size={28} />}
                             {assignment.type === 'speaking' && <Mic size={28} />}
                             {assignment.type === 'reading' && <BookOpen size={28} />}
                           </div>
                           <div>
                             <h4 className="font-bold text-gray-900 text-lg leading-tight">{t(`homework.type.${assignment.type}`)}</h4>
                             <p className="text-sm text-gray-500 font-medium">{t(`homework.${assignment.title}`)}</p>
                           </div>
                         </div>
                         
                         {assignment.isCompleted ? (
                           <div className="flex items-center gap-2 text-green-600">
                             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                               <Check size={18} strokeWidth={3} />
                             </div>
                           </div>
                         ) : assignment.isCurrent ? (
                           <button 
                             onClick={() => setView('task')}
                             className="w-12 h-12 bg-[#0056D2] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                           >
                             <ArrowRight size={24} />
                           </button>
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                             <Lock size={18} />
                           </div>
                         )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 px-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Search size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-medium italic">No assignments for this lesson yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div id="homework-task-view" className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
       {/* Task Back Nav */}
       <div className="flex items-center gap-4 mb-4">
         <button 
           onClick={() => setView('path')}
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
          <span className="text-xs font-bold text-gray-400">{currentIndex + 1} / {MOCK_SENTENCES.length} {t('homework.pages')}</span>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#0056D2] transition-all duration-300" style={{ width: `${((currentIndex + 1) / MOCK_SENTENCES.length) * 100}%` }} />
          </div>
          <div className="bg-green-100 text-green-700 font-bold text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Star size={12} className="fill-green-600" />
            +10 XP
          </div>
        </div>

        <div className="flex flex-col items-center py-12 space-y-8">
          <div className="text-center relative">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-wide leading-tight group flex items-center justify-center gap-4">
              <span className="font-noto">{currentSentence.zh}</span>
              <button 
                onClick={() => ttsService.speak(currentSentence.zh, 'zh-CN')}
                className="p-3 bg-[#0056D2] text-white rounded-full hover:bg-blue-700 transition-all shadow-md hover:scale-110 active:scale-95"
              >
                <Volume2 size={28} />
              </button>
            </h2>
            <div className="flex flex-col items-center gap-2 mt-2">
              <p className="text-xl text-gray-400 font-medium italic">{currentSentence.pinyin}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-base text-gray-500 bg-gray-100 px-5 py-2 rounded-full font-medium">{currentSentence.ru}</span>
                 <button 
                  onClick={() => ttsService.speak(currentSentence.ru, 'ru-RU')}
                  className="p-2 text-gray-400 hover:text-[#0056D2] transition-all hover:scale-110"
                >
                  <Volume2 size={20} />
                </button>
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
                  {t('homework.ready')}
                </div>
              )}
              <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                00:{recordingTime.toString().padStart(2, '0')} / 00:10
              </div>
            </div>

            <div className="flex items-center gap-10">
              <button 
                onClick={() => { setAudioUrl(null); setRecordingTime(0); }}
                className="w-14 h-14 rounded-full border-2 border-gray-200 text-gray-400 flex items-center justify-center hover:bg-white hover:text-red-500 transition-all disabled:opacity-30 shadow-sm"
                disabled={!audioUrl || isRecording}
              >
                <RotateCcw size={24} />
              </button>
              
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-[#0056D2] text-white flex items-center justify-center shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 group relative"
                >
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 group-hover:hidden" />
                  <Mic size={48} className="group-hover:opacity-90 relative z-10" />
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 group animate-pulse"
                >
                  <StopCircle size={48} className="group-hover:opacity-90" />
                </button>
              )}

              <button 
                onClick={handleCheck}
                className={`w-14 h-14 rounded-full border-2 text-gray-400 flex items-center justify-center transition-all shadow-sm ${
                  audioUrl && !isRecording ? 'border-green-500 text-green-500 hover:bg-green-50' : 'border-gray-200 opacity-30 cursor-not-allowed'
                }`}
                disabled={!audioUrl || isRecording}
              >
                <CheckCircle2 size={32} />
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
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
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
                  <p className="text-2xl font-bold text-gray-900 mb-2 leading-tight font-noto">{currentSentence.zh}</p>
                  <p className="text-base text-gray-500 font-medium">{currentSentence.ru}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-[260px] right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 p-5 h-24 flex items-center z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex gap-4">
            <button onClick={() => { const prevIdx = (currentIndex - 1 + MOCK_SENTENCES.length) % MOCK_SENTENCES.length; setCurrentIndex(prevIdx); setShowAnalysis(false); setAudioUrl(null); setRecordingTime(0); }} className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95">
              <ChevronLeft size={20} />
              {t('homework.prev')}
            </button>
            <button onClick={() => alert(t('homework.explain') + ': ' + currentSentence.zh)} className="flex items-center gap-2 px-6 py-3 text-[#0056D2] font-bold hover:bg-blue-50 rounded-xl transition-all">
              <Lightbulb size={20} />
              {t('homework.explain')}
            </button>
          </div>
          <div className="flex gap-4">
            <button onClick={() => alert(t('homework.save') + '...')} className="px-8 py-3 bg-gray-50 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all border border-gray-200">{t('homework.save')}</button>
            <button onClick={() => { const nextIdx = (currentIndex + 1) % MOCK_SENTENCES.length; setCurrentIndex(nextIdx); setShowAnalysis(false); setAudioUrl(null); setRecordingTime(0); }} className="flex items-center gap-2 px-10 py-3 bg-[#0056D2] text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 group">
              {t('homework.next')}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkView;
