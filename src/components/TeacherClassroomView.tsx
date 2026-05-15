import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Monitor, 
  MessageSquare, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Hand,
  Mic,
  Video,
  Settings,
  LogOut,
  Maximize2,
  Languages,
  Volume2,
  BarChart2,
  X,
  ChevronDown,
  AlertCircle,
  Minimize2,
  Send,
  Plus,
  RefreshCw,
  FileText,
  Loader2,
  Loader,
  Presentation,
  Pen,
  Palette,
  Trash2,
  Play,
  StopCircle,
  CheckCircle2,
  BookOpen,
  Layers,
  Check,
  RotateCcw,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import Logo from './Logo.tsx';
import PdfViewer from './PdfViewer.tsx';
import { lecturesApi, coursesApi, homeworkApi, vocabularyApi, learningRecordsApi, recordingsApi, ttsApi, liveSessionsApi, type CoursePage, type LearningTask, type VocabularyItem, type LiveSessionData, mediaUrl, fileToBase64 } from '../services/apiClient.ts';
import { ttsService } from '../services/ttsService.ts';

interface TeacherClassroomViewProps {
  onExit: () => void;
  role?: 'teacher' | 'student';
}

const TeacherClassroomView: React.FC<TeacherClassroomViewProps> = ({ onExit, role = 'teacher' }) => {
  const { t } = useLanguage();
  const isTeacher = role === 'teacher';
  const [showPoll, setShowPoll] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [camPosition, setCamPosition] = useState({ x: 32, y: 120 });
  const [isPPTLocked, setIsPPTLocked] = useState(true);
  const [inputText, setInputText] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: number; user: string; text: string; isSelf?: boolean }[]>([]);
  const [danmaku, setDanmaku] = useState<{ id: number; text: string; top: number; duration: number; isSelf?: boolean }[]>([]);
  const [transcript, setTranscript] = useState<{ zh: string; ru: string }[]>([]);

  // Hardware states
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Live and Recording states
  const [liveMode, setLiveMode] = useState<'local' | 'multimedia'>('multimedia');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [coursePages, setCoursePages] = useState<CoursePage[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [isPdfType, setIsPdfType] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const recordingStartedAtRef = React.useRef<number>(0);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

  // Canvas toggle — not auto-activated
  const [isCanvasEnabled, setIsCanvasEnabled] = useState(false);
  const [brushColor, setBrushColor] = useState('#3b82f6');
  const [brushWidth, setBrushWidth] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Raise-hand flow
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [pendingHandRaise, setPendingHandRaise] = useState(false);
  const [studentName, setStudentName] = useState(t('classroom.student_label') || 'Student');

  // Student homework/vocabulary panels
  const [showHomeworkPanel, setShowHomeworkPanel] = useState(false);
  const [showVocabPanel, setShowVocabPanel] = useState(false);
  const [homeworkTasks, setHomeworkTasks] = useState<LearningTask[]>([]);
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [hwCurrentIdx, setHwCurrentIdx] = useState(0);
  const [vocabQuizIdx, setVocabQuizIdx] = useState(0);
  const [vocabQuizMode, setVocabQuizMode] = useState<'zh2ru' | 'ru2zh'>('zh2ru');
  const [vocabScore, setVocabScore] = useState(0);
  const [hwRecording, setHwRecording] = useState(false);
  const [hwAudioUrl, setHwAudioUrl] = useState<string | null>(null);
  const [hwRecordings, setHwRecordings] = useState<{ id: string; url: string }[]>([]);
  const hwMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const hwAudioChunksRef = useRef<Blob[]>([]);
  const [vocabAnswer, setVocabAnswer] = useState<string | null>(null);
  const [vocabResult, setVocabResult] = useState<boolean | null>(null);

  // Live session
  const [liveSession, setLiveSession] = useState<LiveSessionData | null>(null);
  const liveSessionRef = useRef<LiveSessionData | null>(null);

  const stopTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const cleanupMedia = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTracks(localStreamRef.current);
    stopTracks(screenStreamRef.current);
    setLocalStream(null);
    setScreenStream(null);
    setIsMicOn(false);
    setIsCamOn(false);
    setIsScreenSharing(false);
    setIsRecording(false);
  };

  React.useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  React.useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  React.useEffect(() => {
    mediaRecorderRef.current = mediaRecorder;
  }, [mediaRecorder]);

  useEffect(() => {
    const loadPages = async () => {
      const courseId = localStorage.getItem('lingobridge_courseId') || 'course-1';
      setPagesLoading(true);
      try {
        const pages = await coursesApi.pages(courseId);
        setCoursePages(pages);
        if (pages.length > 0) setCurrentPageIdx(0);
      } catch {
        // no pages yet
      } finally {
        setPagesLoading(false);
      }
    };
    loadPages();
  }, []);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, []);

  // Canvas dynamic resize to match container
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Raise-hand flow: listen for grants via localStorage events
  useEffect(() => {
    if (role !== 'student') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lingobridge_permission_granted' && e.newValue === 'true') {
        setIsPermissionGranted(true);
        setIsHandRaised(false);
      }
    };

    window.addEventListener('storage', handleStorage);

    // Also check on mount in case grant was already sent
    if (localStorage.getItem('lingobridge_permission_granted') === 'true') {
      setIsPermissionGranted(true);
      setIsHandRaised(false);
    }

    return () => window.removeEventListener('storage', handleStorage);
  }, [role]);

  // Teacher: listen for hand raises
  useEffect(() => {
    if (role !== 'teacher') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lingobridge_hand_raised' && e.newValue === 'true') {
        setPendingHandRaise(true);
        setStudentName(e.newValue === 'true' ? (t('classroom.student_label') || 'Student') : (t('classroom.student_label') || 'Student'));
      }
    };

    window.addEventListener('storage', handleStorage);

    if (localStorage.getItem('lingobridge_hand_raised') === 'true') {
      setPendingHandRaise(true);
    }

    return () => window.removeEventListener('storage', handleStorage);
  }, [role]);

  // Load homework/vocab for student
  useEffect(() => {
    if (role !== 'student') return;
    const courseId = localStorage.getItem('lingobridge_courseId') || 'course-1';
    homeworkApi.tasks(courseId).then(setHomeworkTasks).catch(() => {});
    vocabularyApi.list(courseId).then(setVocabItems).catch(() => {});
  }, [role]);

  // Live session lifecycle
  useEffect(() => {
    const courseId = localStorage.getItem('lingobridge_courseId') || 'course-1';
    let ended = false;

    if (isTeacher) {
      liveSessionsApi.create(courseId, liveMode === 'local' ? 'screen' : 'pdf')
        .then((s) => { setLiveSession(s); liveSessionRef.current = s; })
        .catch(() => {});
    } else {
      liveSessionsApi.getActive(courseId)
        .then((session) => {
          if (session && !ended) {
            setLiveSession(session);
            liveSessionRef.current = session;
            if (session.currentPage) {
              if (isPdfType) setPdfPage(session.currentPage);
              else setCurrentPageIdx(session.currentPage - 1);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      ended = true;
      const session = liveSessionRef.current;
      if (session?.id && isTeacher) {
        liveSessionsApi.patch(session.id, { status: 'ended' }).catch(() => {});
      }
    };
  }, [role]);

  // Update live session page/source when changed
  useEffect(() => {
    if (!liveSession?.id || !isTeacher) return;
    const page = isPdfType ? pdfPage : currentPageIdx + 1;
    const timer = setTimeout(() => {
      liveSessionsApi.patch(liveSession.id, {
        currentPage: page,
        sourceMode: liveMode === 'local' ? 'screen' : 'pdf'
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [pdfPage, currentPageIdx, liveMode]);

  // Poll live session comments every 5 seconds
  useEffect(() => {
    if (!liveSession?.id) return;
    const interval = setInterval(() => {
      liveSessionsApi.comments.list(liveSession.id).then((comments) => {
        if (comments?.length) {
          setChatMessages(prev => {
            // Dedup by text content since local messages use Date.now() id and API returns UUID
            const existingTexts = new Set(prev.map(c => c.text));
            const newComments = comments.filter((c: any) => !existingTexts.has(c.body));
            if (!newComments.length) return prev;
            return [...prev, ...newComments.map((c: any) => ({
              id: c.id,
              user: c.studentName || (t('classroom.student_label') || 'Student'),
              text: c.body,
              isSelf: false,
            }))];
          });
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [liveSession?.id]);

  // Toggle Fullscreen logic
  const toggleFullscreen = () => {
    const elem = document.getElementById('classroom-view');
    if (!document.fullscreenElement && elem) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const id = Date.now();
    const text = inputText;

    // Send to local Chat
    setChatMessages(prev => [...prev, { id, user: isTeacher ? (t('classroom.teacher_label') || 'Teacher') : (t('classroom.student_label') || 'Student'), text, isSelf: true }]);

    // Send to API if live session exists
    if (liveSession?.id) {
      liveSessionsApi.comments.send(liveSession.id, text).catch(() => {});
    }

    // Trigger Danmaku
    setDanmaku(prev => [...prev, {
      id,
      text,
      top: 20 + Math.random() * 40,
      duration: 10,
      isSelf: true
    }]);

    setInputText('');
    setTimeout(() => setDanmaku(prev => prev.filter(d => d.id !== id)), 10000);
  };

  const toggleMic = async () => {
    try {
      if (!isMicOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (localStream) {
          stream.getAudioTracks().forEach(track => localStream.addTrack(track));
          // Create new stream object to trigger re-render for consumers (e.g. video elements)
          setLocalStream(new MediaStream(localStream.getTracks()));
        } else {
          setLocalStream(stream);
        }
        setIsMicOn(true);
      } else {
        if (localStream) {
          localStream.getAudioTracks().forEach(track => {
            track.stop();
            localStream.removeTrack(track);
          });
          if (localStream.getTracks().length === 0) {
            setLocalStream(null);
          } else {
            setLocalStream(new MediaStream(localStream.getTracks()));
          }
        }
        setIsMicOn(false);
      }
    } catch (err: any) {
      console.error("Mic access denied", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert(t('classroom.mic_denied') || "Mic access denied. Please enable microphone permissions.");
      }
    }
  };

  const toggleCam = async () => {
    try {
      if (!isCamOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (localStream) {
          stream.getVideoTracks().forEach(track => localStream.addTrack(track));
          setLocalStream(new MediaStream(localStream.getTracks()));
        } else {
          setLocalStream(stream);
        }
        setIsCamOn(true);
      } else {
        if (localStream) {
          localStream.getVideoTracks().forEach(track => {
            track.stop();
            localStream.removeTrack(track);
          });
          if (localStream.getTracks().length === 0) {
            setLocalStream(null);
          } else {
            setLocalStream(new MediaStream(localStream.getTracks()));
          }
        }
        setIsCamOn(false);
      }
    } catch (err: any) {
      console.error("Camera access denied", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert(t('classroom.cam_denied') || "Camera access denied. Please enable camera permissions.");
      }
    }
  };

  const toggleRecording = () => {
    if (!isTeacher) return;
    if (!isRecording) {
      // Start Recording
      try {
        const stream = (liveMode === 'local' && screenStream) ? screenStream : localStream;
        if (!stream) {
          alert(t('classroom.no_stream') || 'No stream available to record. Please turn on camera or share screen.');
          return;
        }
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          try {
            await lecturesApi.upload({
              courseId: localStorage.getItem('lingobridge_courseId') || 'course-1',
              title: t('course.basic') + ' - ' + new Date().toLocaleTimeString(),
              blob,
              durationSec: Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
            });
            alert(t('classroom.recording_uploaded') || 'Recording uploaded! Students can view it in schedule replays.');
          } catch (error: any) {
            console.error("Failed to upload recording", error);
            alert(error.message || (t('classroom.recording_upload_failed') || 'Recording upload failed. Is the backend running?'));
          }
        };
        recorder.start();
        recordingStartedAtRef.current = Date.now();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recording", err);
      }
    } else {
      // Stop Recording
      if (mediaRecorder) {
        mediaRecorder.stop();
        setMediaRecorder(null);
      }
      setIsRecording(false);
    }
  };

  const startScreenShare = async () => {
    if (!isTeacher) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setIsScreenSharing(true);
      setLiveMode('local');
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
        setLiveMode('multimedia');
      };
    } catch (err) {
      console.error("Screen share error", err);
    }
  };

  const stopScreenShare = () => {
    if (!isTeacher) return;
    if (screenStream) {
      stopTracks(screenStream);
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    setLiveMode('multimedia');
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTeacher) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const courseId = localStorage.getItem('lingobridge_courseId') || 'course-1';
    try {
      setPagesLoading(true);
      const result = await coursesApi.uploadCourseware(courseId, file);
      const fileMeta = result.file as { mimeType?: string; storageUrl?: string } | undefined;
      setIsPdfType(fileMeta?.mimeType === 'application/pdf' || file.name.endsWith('.pdf'));
      setPdfFile(mediaUrl(fileMeta?.storageUrl));
      setPdfPage(1);
      const pages = result.pages || [];
      setCoursePages(pages);
      setCurrentPageIdx(0);
      setLiveMode('multimedia');
    } catch (err: any) {
      alert(err.message || (t('classroom.upload_failed') || 'Upload failed'));
    } finally {
      setPagesLoading(false);
    }
  };

  // Canvas Drawing logic — improved smoothness and precision
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTeacher || !isCanvasEnabled) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTeacher || !isCanvasEnabled) return;
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    if (!isTeacher) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  return (
    <div id="classroom-view" className="fixed inset-0 bg-[#0F172A] text-white z-[60] flex flex-col font-sans">
      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{isTeacher ? t('classroom.end_confirm_title') : t('classroom.leave_confirm_title')}</h3>
              <p className="text-gray-500 text-sm mb-8">{isTeacher ? t('classroom.end_confirm_desc') : t('classroom.leave_confirm_desc')}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {t('classroom.cancel')}
                </button>
                <button
                  onClick={() => {
                    cleanupMedia();
                    onExit();
                  }}
                  className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  {isTeacher ? t('classroom.end_btn') : t('classroom.leave')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poll Overlay */}
      <AnimatePresence>
        {showPoll && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl text-gray-900 relative">
              <button
                onClick={() => setShowPoll(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0056D2]">
                  <BarChart2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{t('classroom.poll')}</h3>
                  <p className="text-xs text-gray-400 font-medium tracking-wide font-noto">{t('classroom.interactive_assessment')}</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="font-bold text-gray-800 text-lg">{t('classroom.poll_question')}</p>
                <div className="space-y-3">
                  {['dà jiā hǎo', 'dá jiā hǎo', 'dà jiā hāo'].map((label, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-0" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center">{t('classroom.poll_not_started') || 'Start a poll to see live results'}</p>
                <button
                  onClick={() => setShowPoll(false)}
                  className="w-full py-4 bg-[#0056D2] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                >
                  {t('classroom.end_poll')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants Sidebar Drawer */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-16 bottom-20 w-80 bg-[#1e293b] border-l border-white/10 z-[80] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold">{t('classroom.students')}</h3>
              <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Users size={32} className="mb-3 opacity-30" />
                <p className="text-xs font-medium">{t('classroom.no_participants') || 'Waiting for participants to join...'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="h-16 px-6 border-b border-gray-800 flex justify-between items-center bg-[#0F172A] relative z-[90]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold tracking-tight">{t('classroom.course_title')}</span>
          </div>
          <div className="h-4 w-[1px] bg-gray-800" />
          <div className="flex items-center gap-2 text-xs font-bold text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {t('classroom.live_stream')}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Teacher sees hand-raise badge */}
          {isTeacher && pendingHandRaise && (
            <button
              onClick={() => {
                localStorage.setItem('lingobridge_permission_granted', 'true');
                setPendingHandRaise(false);
                localStorage.removeItem('lingobridge_hand_raised');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
            >
              <Hand size={18} />
              <span className="hidden sm:inline">{t('classroom.hand_raised') || 'Hand Raised'}</span>
            </button>
          )}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${showParticipants ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
          >
            <Users size={18} />
            <span className="hidden sm:inline">{t('classroom.students')}</span>
          </button>
          <button
            onClick={() => setShowExitConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">{t('classroom.leave')}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Display Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Main Stage Area */}
          <div className="flex-1 relative overflow-hidden bg-black flex flex-col group/stage z-30">
            {liveMode === 'local' ? (
              <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
                {screenStream ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => { if (el) el.srcObject = screenStream; }}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <Monitor size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold">{t('classroom.start_screen_hint') || 'Ready to share screen'}</p>
                  </div>
                )}
                <div className="absolute top-8 left-8 z-[100] flex items-center gap-2">
                {isTeacher && (
                  <button
                       onClick={stopScreenShare}
                       className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                     >
                       <X size={14} /> {t('classroom.stop_share')}
                     </button>
                )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-white text-gray-900 relative overflow-hidden rounded-b-3xl shadow-inner">
                {pagesLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                  </div>
                ) : isPdfType && pdfFile ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
                    <PdfViewer
                      url={pdfFile}
                      page={pdfPage}
                      onPageCount={setPdfPageCount}
                    />
                  </div>
                ) : coursePages.length > 0 && coursePages[currentPageIdx] ? (
                  <div
                    className="w-full h-full overflow-auto p-8"
                    dangerouslySetInnerHTML={{ __html: coursePages[currentPageIdx].contentHtml }}
                  />
                ) : pdfFile && !isPdfType ? (
                  <div
                    className="w-full h-full overflow-auto p-8"
                    dangerouslySetInnerHTML={{ __html: coursePages[currentPageIdx]?.contentHtml || '' }}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                      <img
                        src="https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=1200&auto=format&fit=crop"
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <motion.div layout className="text-center select-none z-10">
                      {isTeacher ? (
                        <>
                          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                            <Presentation size={32} className="text-gray-500" />
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-300">{t('classroom.empty_teacher_title') || 'No Content Yet'}</h2>
                          <p className="text-sm md:text-base text-gray-500 max-w-md">{t('classroom.empty_teacher_desc') || 'Upload a PDF from your courses page or share your screen to start teaching.'}</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                            <Loader size={32} className="text-gray-500 animate-pulse" />
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-300">{t('classroom.empty_student_title') || 'Waiting for Class to Start'}</h2>
                          <p className="text-sm md:text-base text-gray-500 max-w-md">{t('classroom.empty_student_desc') || 'The teacher has not started sharing content yet. Please wait...'}</p>
                        </>
                      )}
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {/* Canvas Drawing Layer — only active when toggled on */}
            <div ref={canvasContainerRef} className="absolute inset-0 z-40 w-full h-full pointer-events-none">
              {isCanvasEnabled && isTeacher && (
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-auto"
                />
              )}
            </div>

            {/* Control Sidebar (Left) */}
            {isTeacher && (
            <div className="absolute top-24 left-6 z-[120] flex flex-col items-start gap-3 pointer-events-none">
              <button
                onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-xl flex items-center justify-center pointer-events-auto hover:bg-gray-50 transition-all active:scale-95 group"
              >
                {isControlsExpanded ? <X size={20} className="text-gray-600" /> : <Settings size={20} className="text-gray-600 group-hover:rotate-90 transition-transform" />}
              </button>

              <AnimatePresence>
                {isControlsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-gray-200 shadow-2xl flex flex-col gap-5 pointer-events-auto w-64"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('classroom.content_mode') || 'Content Mode'}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setLiveMode('local')}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            liveMode === 'local' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {t('classroom.recording_mode') || 'Recording'}
                        </button>
                        <button
                          onClick={() => setLiveMode('multimedia')}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            liveMode === 'multimedia' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {t('classroom.media_mode') || 'Media'}
                        </button>
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-gray-100" />

                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => setIsPPTLocked(!isPPTLocked)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold border transition-all ${
                          isPPTLocked ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Monitor size={16} />
                          {isPPTLocked ? t('classroom.ppt_locked') : t('classroom.ppt_unlocked')}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${isPPTLocked ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
                      </button>

                      <label className="flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-600 cursor-pointer hover:bg-blue-100 transition-all">
                         <Plus size={16} />
                         {t('classroom.upload_pdf') || 'Upload PDF'}
                         <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                      </label>

                      {/* Canvas toggle button — teacher only */}
                      <button
                        onClick={() => setIsCanvasEnabled(!isCanvasEnabled)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold border transition-all ${
                          isCanvasEnabled ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Pen size={16} />
                          {isCanvasEnabled ? (t('classroom.canvas_active') || 'Drawing ON') : (t('classroom.canvas_inactive') || 'Drawing OFF')}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${isCanvasEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </button>

                      {/* Brush controls — visible when canvas on */}
                      {isCanvasEnabled && (
                        <div className="flex flex-col gap-3 px-2">
                          <div className="flex items-center gap-2">
                            <Palette size={12} className="text-gray-400" />
                            {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#000000'].map(c => (
                              <button
                                key={c}
                                onClick={() => setBrushColor(c)}
                                className="w-5 h-5 rounded-full border-2 transition-all"
                                style={{ backgroundColor: c, borderColor: brushColor === c ? '#333' : '#e5e7eb' }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span>{t('classroom.brush_size') || 'Size'}:</span>
                            {[2, 4, 6, 10].map(w => (
                              <button
                                key={w}
                                onClick={() => setBrushWidth(w)}
                                className={`px-2 py-0.5 rounded font-bold transition-all ${brushWidth === w ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Teacher-only PG paginator */}
                      {(pdfFile || coursePages.length > 0) && liveMode === 'multimedia' && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 p-2">
                           <button
                            onClick={(e) => { e.stopPropagation(); if (isPdfType) { setPdfPage(p => Math.max(1, p - 1)); } else { setCurrentPageIdx(i => Math.max(0, i - 1)); } }}
                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                           >
                            <ChevronLeft size={16} />
                           </button>
                           <span className="text-[11px] font-black text-gray-700 min-w-[60px] text-center">{(t('classroom.pg') || 'PG')} {isPdfType ? pdfPage : currentPageIdx + 1}</span>
                           <button
                             onClick={(e) => { e.stopPropagation(); if (isPdfType) { setPdfPage(p => Math.min(pdfPageCount || 999, p + 1)); } else { setCurrentPageIdx(i => Math.min(coursePages.length - 1, i + 1)); } }}
                             className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                            >
                            <ChevronRight size={16} />
                           </button>
                        </div>
                      )}
                    </div>

                    <div className="h-[1px] w-full bg-gray-100" />

                    <button
                      onClick={clearCanvas}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold bg-gray-900 text-white hover:bg-black transition-all shadow-xl"
                    >
                      <RefreshCw size={16} /> {t('classroom.clear_canvas') || 'Clear Ink'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Shared Overlays (Danmaku, ASR, Camera) */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {danmaku.map((d) => (
                <motion.div
                  key={d.id}
                  initial={{ x: '100vw' }}
                  animate={{ x: '-100vw' }}
                  transition={{ duration: d.duration, ease: 'linear' }}
                  style={{ top: `${d.top}%` }}
                  className={`absolute whitespace-nowrap font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-2 px-6 py-2 rounded-full backdrop-blur-md border ${
                    d.isSelf ? 'bg-blue-600/80 text-white border-blue-400' : 'bg-black/40 text-white border-white/10'
                  }`}
                >
                  {d.isSelf && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                  {d.text}
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-4 inset-x-0 h-16 bg-black/40 backdrop-blur-md px-4 md:px-6 flex justify-between items-center text-white z-50 rounded-b-3xl">
              <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <Monitor size={14} />
                {liveMode === 'local'
                  ? (t('classroom.ppt_recording_mode') || 'PPT RECORDING')
                  : isTeacher
                    ? (t('classroom.multimedia') || 'MULTIMEDIA')
                    : (t('classroom.presentation_active') || 'PRESENTATION')}
              </div>

              {/* Pagination controls — visible to both but label differs */}
              <div className="flex items-center gap-8 mx-auto md:mx-0">
                <button
                  onClick={() => { if (isPdfType) { setPdfPage(p => Math.max(1, p - 1)); } else { setCurrentPageIdx(i => Math.max(0, i - 1)); } }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title={t('homework.prev')}
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center min-w-[60px]">
                  <div className="text-xs font-black">{isPdfType ? pdfPage : (coursePages.length > 0 ? currentPageIdx + 1 : 1)}</div>
                  <div className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">{t('classroom.slide') || 'SLIDE'}</div>
                </div>
                <button
                  onClick={() => { if (isPdfType) { setPdfPage(p => Math.min(pdfPageCount || 999, p + 1)); } else { setCurrentPageIdx(i => Math.min(coursePages.length - 1, i + 1)); } }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title={t('homework.next')}
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Translation Tracker Section */}
          {showTranscript && (
          <div className="h-40 bg-[#0F172A] border-t border-gray-800 flex flex-col z-20 relative">
             <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 tracking-tighter uppercase whitespace-nowrap">
                   <Languages size={12} />
                   {t('classroom.transcript_title')}
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-bold text-gray-500 uppercase">{t('classroom.cn_ru_active')}</span>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-4">
                {transcript.map((line, i) => (
                  <div key={i} className="flex gap-6 items-start">
                      <div className="text-[10px] font-mono text-gray-700 mt-0.5 tracking-tighter">{t('classroom.rec') || 'REC'}</div>
                     <div className="flex-1 grid grid-cols-2 gap-8 border-l border-white/5 pl-4">
                        <p className="text-xs text-blue-100 font-medium border-l border-blue-500 pl-3">{line.zh}</p>
                        <p className="text-xs text-gray-400 italic border-l border-white/10 pl-3">{line.ru}</p>
                     </div>
                  </div>
                ))}
                {!transcript.length && (
                  <div className="h-full flex items-center justify-center text-gray-600 text-[10px] uppercase tracking-widest font-bold">
                     {t('classroom.system_ready')}
                  </div>
                )}
             </div>
          </div>
          )}

          {/* Draggable Teacher Camera Window - Floating Overlay */}
          <motion.div
            drag
            dragMomentum={false}
            initial={{ left: 'auto', right: 32, bottom: 200 }}
            className="absolute w-56 h-40 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500/50 z-[110] cursor-move active:scale-95 transition-transform"
          >
            {isCamOn ? (
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el && localStream) el.srcObject = localStream;
                }}
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <Video size={32} className="text-gray-600 mb-2" />
                <img
                  src="https://images.unsplash.com/photo-1544717305-27a734ef1904?q=80&w=600&auto=format&fit=crop"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-20 grayscale"
                  alt="Teacher sitting at computer"
                />
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
               <div className={`${isMicOn ? 'bg-blue-600' : 'bg-gray-700'} rounded px-2 py-0.5 text-[8px] font-bold flex items-center gap-1 shadow-lg transition-colors`}>
                  <Mic size={8} className={isMicOn ? 'animate-pulse' : ''} />
                  {isMicOn ? (t('classroom.on') || 'ON') : (t('classroom.off') || 'OFF')}
               </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white border border-white/10 uppercase tracking-tighter">
              {isTeacher ? (t('classroom.teacher_label') || 'Teacher') : t('classroom.waiting_teacher')}
            </div>
          </motion.div>
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#0F172A] border-l border-gray-800 flex flex-col overflow-hidden"
            >
              <div className="h-16 px-6 border-b border-gray-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">{t('classroom.live_discussion')}</h4>
                  <div className="bg-red-500 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>
                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                 {chatMessages.map(msg => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className={`flex flex-col gap-1 ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[10px] font-bold ${msg.isSelf ? 'text-blue-400' : 'text-gray-400'}`}>{msg.user} {msg.isSelf && `(${isTeacher ? t('classroom.instructor') : t('classroom.students')})`}</span>
                      <div className={`text-xs p-3 rounded-2xl border ${
                        msg.isSelf ? 'bg-blue-600/20 border-blue-500/20 rounded-tr-none' : 'bg-white/5 border-white/5 rounded-tl-none text-white'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                 ))}
                 {!chatMessages.length && (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs italic text-center px-4">
                       {t('classroom.waiting_interaction')}
                    </div>
                 )}
              </div>
              <div className="p-4 border-t border-gray-800 bg-[#0F172A]">
                 <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                       type="text"
                       value={inputText}
                       onChange={(e) => setInputText(e.target.value)}
                       placeholder={t('classroom.say_something')}
                       className="flex-1 bg-white/5 border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 transition-all text-white"
                    />
                    <button type="submit" className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors">
                      <Send size={16} />
                    </button>
                 </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Student Homework Panel */}
        <AnimatePresence>
          {!isTeacher && showHomeworkPanel && homeworkTasks.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#0F172A] border-l border-gray-800 flex flex-col overflow-hidden"
            >
              <div className="h-16 px-6 border-b border-gray-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-400" />
                  <h4 className="font-bold text-sm">{t('homework.title') || 'Homework'}</h4>
                </div>
                <button onClick={() => setShowHomeworkPanel(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                {homeworkTasks.map((task, idx) => (
                  <div
                    key={task.taskId}
                    className={`p-4 rounded-2xl border transition-all ${
                      idx === hwCurrentIdx ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {task.taskType} · {task.lessonTitle || `L${task.lesson}`}
                      </span>
                      <button
                        onClick={() => ttsService.speak(task.zhText)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                    <p className="text-lg font-bold text-white font-noto mb-1">{task.zhText}</p>
                    <p className="text-xs text-gray-400 italic mb-2">{task.pinyin}</p>
                    <p className="text-xs text-gray-500 mb-3">{task.translationRu}</p>

                    {idx === hwCurrentIdx && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                        {!hwRecording ? (
                          <button
                            onClick={async () => {
                              try {
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                const mr = new MediaRecorder(stream);
                                hwMediaRecorderRef.current = mr;
                                hwAudioChunksRef.current = [];
                                mr.ondataavailable = (e) => { if (e.data.size > 0) hwAudioChunksRef.current.push(e.data); };
                                mr.onstop = () => {
                                  const blob = new Blob(hwAudioChunksRef.current, { type: 'audio/webm' });
                                  const url = URL.createObjectURL(blob);
                                  setHwAudioUrl(url);
                                  setHwRecordings(prev => [...prev, { id: Date.now().toString(), url }]);
                                  stream.getTracks().forEach(t => t.stop());
                                };
                                mr.start();
                                setHwRecording(true);
                              } catch { alert(t('classroom.mic_denied') || 'Microphone access denied'); }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                          >
                            <Mic size={14} /> {t('homework.record') || 'Record'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              hwMediaRecorderRef.current?.stop();
                              setHwRecording(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold animate-pulse"
                          >
                            <StopCircle size={14} /> {t('homework.stop') || 'Stop'}
                          </button>
                        )}
                        {hwAudioUrl && (
                          <button
                            onClick={() => { const a = new Audio(hwAudioUrl); a.play(); }}
                            className="p-2 hover:bg-white/10 rounded-lg text-green-400 transition-colors"
                          >
                            <Play size={16} />
                          </button>
                        )}
                      </div>
                    )}

                    {idx === hwCurrentIdx && hwRecordings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {hwRecordings.map((rec, ri) => (
                          <div key={ri} className="flex items-center gap-2 text-[10px] text-gray-400">
                            <span>{t('homework.recording') || 'Recording'} #{ri + 1}</span>
                            <button
                              onClick={() => {
                                URL.revokeObjectURL(rec.url);
                                setHwRecordings(prev => prev.filter(r => r.id !== rec.id));
                                if (hwAudioUrl === rec.url) setHwAudioUrl(null);
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{hwCurrentIdx + 1}/{homeworkTasks.length}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setHwCurrentIdx(i => Math.max(0, i - 1)); setHwAudioUrl(null); }}
                    disabled={hwCurrentIdx === 0}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => { setHwCurrentIdx(i => Math.min(homeworkTasks.length - 1, i + 1)); setHwAudioUrl(null); }}
                    disabled={hwCurrentIdx >= homeworkTasks.length - 1}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Student Vocabulary Panel */}
        <AnimatePresence>
          {!isTeacher && showVocabPanel && vocabItems.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#0F172A] border-l border-gray-800 flex flex-col overflow-hidden"
            >
              <div className="h-16 px-6 border-b border-gray-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-purple-400" />
                  <h4 className="font-bold text-sm">{t('nav.vocabulary') || 'Vocabulary'}</h4>
                </div>
                <button onClick={() => setShowVocabPanel(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setVocabQuizMode('zh2ru')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      vocabQuizMode === 'zh2ru' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {t('vocab.translate_to_ru') || '中文→俄文'}
                  </button>
                  <button
                    onClick={() => setVocabQuizMode('ru2zh')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      vocabQuizMode === 'ru2zh' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {t('vocab.translate_to_zh') || '俄文→中文'}
                  </button>
                </div>

                {vocabItems.length > 0 && (() => {
                  const word = vocabItems[vocabQuizIdx];
                  const options = [word, ...vocabItems.filter(v => v.taskId !== word.taskId).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
                  const questionText = vocabQuizMode === 'zh2ru' ? word.zhText : word.translationRu;
                  const correctAnswer = vocabQuizMode === 'zh2ru' ? word.translationRu : word.zhText;

                  return (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <p className="text-3xl font-bold text-white mb-4 font-noto">{questionText}</p>
                        <button
                          onClick={() => ttsService.speak(word.zhText)}
                          className="w-12 h-12 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all flex items-center justify-center mx-auto"
                        >
                          <Volume2 size={22} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {options.map((opt, i) => {
                          const val = vocabQuizMode === 'zh2ru' ? opt.translationRu : opt.zhText;
                          const isSelected = vocabAnswer === val;
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setVocabAnswer(val);
                                setVocabResult(val === correctAnswer);
                              }}
                              className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all ${
                                isSelected
                                  ? vocabResult
                                    ? 'border-green-500 bg-green-500/20 text-green-400'
                                    : 'border-red-500 bg-red-500/20 text-red-400'
                                  : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>

                      {vocabResult !== null && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            {vocabResult ? (
                              <CheckCircle2 size={20} className="text-green-400" />
                            ) : (
                              <X size={20} className="text-red-400" />
                            )}
                            <span className={`text-xs font-bold ${vocabResult ? 'text-green-400' : 'text-red-400'}`}>
                              {vocabResult ? (t('vocab.correct') || 'Correct!') : `${t('vocab.correct_is') || 'Correct:'} ${correctAnswer}`}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (vocabQuizIdx < vocabItems.length - 1) {
                                setVocabQuizIdx(i => i + 1);
                                if (vocabResult) setVocabScore(s => s + 1);
                              } else {
                                setVocabQuizIdx(0);
                                setVocabScore(0);
                              }
                              setVocabAnswer(null);
                              setVocabResult(null);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all"
                          >
                            {vocabQuizIdx < vocabItems.length - 1 ? (t('vocab.continue') || 'Next') : (t('vocab.finish') || 'Restart')}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-4">
                        <span>{vocabQuizIdx + 1}/{vocabItems.length}</span>
                        <span>{t('vocab.score') || 'Score'}: {vocabScore}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <footer className="h-20 bg-[#0F172A] border-t border-gray-800 px-4 md:px-12 flex justify-between items-center z-50">
        <div className="flex gap-4">
          <button
            onClick={toggleMic}
            disabled={!isTeacher && !isPermissionGranted}
            style={{ borderRadius: '22px' }}
            className={`w-12 h-12 flex items-center justify-center transition-all group relative ${
              !isTeacher && !isPermissionGranted
                ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                : isMicOn
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Mic size={22} className={isMicOn ? 'animate-pulse' : ''} />
            {!isTeacher && !isPermissionGranted && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center">
                <Lock size={8} className="text-gray-400" />
              </div>
            )}
          </button>
          <button
            onClick={toggleCam}
            disabled={!isTeacher && !isPermissionGranted}
            style={{ borderRadius: '22px' }}
            className={`w-12 h-12 flex items-center justify-center transition-all group relative ${
              !isTeacher && !isPermissionGranted
                ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                : isCamOn
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Video size={22} />
            {!isTeacher && !isPermissionGranted && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center">
                <Lock size={8} className="text-gray-400" />
              </div>
            )}
          </button>
          {isTeacher && (
          <button
             onClick={toggleRecording}
             style={{ borderRadius: '22px' }}
             className={`w-12 h-12 flex items-center justify-center transition-all group relative ${isRecording ? 'bg-red-600/20 text-red-500 border border-red-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-red-600 mr-1 ${isRecording ? 'animate-pulse' : ''}`} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isRecording ? t('classroom.stop_recording') : t('classroom.recording')}
            </span>
          </button>
          )}
        </div>

        <div className="flex gap-4 md:gap-8 items-center bg-white/5 px-4 md:px-8 py-2 rounded-3xl border border-white/5 shadow-inner">
          {isTeacher && (
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={liveMode === 'local' ? stopScreenShare : startScreenShare}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${liveMode === 'local' ? 'bg-orange-600/20 text-orange-400 border-orange-500/30' : 'bg-blue-600/20 text-blue-400 group-hover:bg-blue-600/30 border-blue-500/30'} border`}>
              <Monitor size={18} />
            </div>
            <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${liveMode === 'local' ? 'text-orange-400' : 'text-blue-400'}`}>{liveMode === 'local' ? t('classroom.stop_share') : t('classroom.screen')}</span>
          </div>
          )}
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setShowChat(!showChat)}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${showChat ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
              <MessageSquare size={18} />
            </div>
            <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('classroom.chat')}</span>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setShowTranscript((value) => !value)}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${showTranscript ? 'bg-white/10 text-white' : 'group-hover:bg-white/5'}`}>
              <Languages size={18} />
            </div>
            <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('classroom.translate')}</span>
          </div>
          {/* Student: homework and vocabulary panel buttons */}
          {!isTeacher && (
            <>
              <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setShowHomeworkPanel(!showHomeworkPanel)}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${showHomeworkPanel ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
                  <BookOpen size={18} />
                </div>
                <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('homework.title') || 'HW'}</span>
              </div>
              <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setShowVocabPanel(!showVocabPanel)}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${showVocabPanel ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
                  <Layers size={18} />
                </div>
                <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('nav.vocabulary') || 'VOC'}</span>
              </div>
            </>
          )}
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center group-hover:bg-white/5 transition-all text-gray-400">
              <Settings size={18} />
            </div>
            <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('classroom.settings')}</span>
          </div>
        </div>

        {isTeacher ? (
        <div className="hidden md:flex w-[200px] justify-end items-center gap-3">
          {/* Teacher: hand-raise notification */}
          {pendingHandRaise && (
            <button
              onClick={() => {
                localStorage.setItem('lingobridge_permission_granted', 'true');
                setPendingHandRaise(false);
                localStorage.removeItem('lingobridge_hand_raised');
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold whitespace-nowrap animate-pulse"
            >
              <Hand size={14} />
              {studentName} {t('classroom.hand_raised') || 'raised hand'}
            </button>
          )}
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${isRecording ? 'bg-red-600/10 border-red-500/20' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-tighter ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>{t('classroom.recording')}</div>
                <div className="text-xs font-bold font-mono">{isRecording ? (t('classroom.live') || 'LIVE') : (t('classroom.stopped') || 'Stopped')}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-500'}`} />
          </button>
        </div>
        ) : (
          <div className="hidden md:flex w-[140px] justify-end">
            {isPermissionGranted ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold">
                <Check size={14} />
                {t('classroom.permission_granted') || 'Mic & Cam OK'}
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsHandRaised(true);
                  localStorage.setItem('lingobridge_hand_raised', 'true');
                }}
                disabled={isHandRaised}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
                  isHandRaised
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 animate-pulse'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Hand size={16} />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {isHandRaised ? (t('classroom.hand_raised') || 'Raised!') : (t('classroom.raise_hand') || 'Raise Hand')}
                </span>
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};

export default TeacherClassroomView;
