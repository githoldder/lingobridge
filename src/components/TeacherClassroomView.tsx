import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import Logo from './Logo.tsx';
import { lecturesApi } from '../services/apiClient.ts';

interface TeacherClassroomViewProps {
  onExit: () => void;
}

const TeacherClassroomView: React.FC<TeacherClassroomViewProps> = ({ onExit }) => {
  const { t } = useLanguage();
  const [showPoll, setShowPoll] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [camPosition, setCamPosition] = useState({ x: 32, y: 120 });
  const [isPPTLocked, setIsPPTLocked] = useState(true);
  const [inputText, setInputText] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: number; user: string; text: string; isSelf?: boolean }[]>([]);
  const [danmaku, setDanmaku] = useState<{ id: number; text: string; top: number; duration: number; isSelf?: boolean }[]>([]);
  const [subtitles, setSubtitles] = useState({ zh: '大家好，欢迎来到我们的中文课！', pinyin: 'Dàjiā hǎo, huānyíng lái dào wǒmen de Zhōngwén kè!', ru: 'Всем привет, добро пожаловать на наш урок китайского языка!' });
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const recordingStartedAtRef = React.useRef<number>(0);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

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

  React.useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, []);

  // Subtitles Simulation
  React.useEffect(() => {
    const lines = [
      { zh: '大家好，欢迎来到我们的中文课！', pinyin: 'Dàjiā hǎo, huānyíng lái dào wǒmen de Zhōngwén kè!', ru: 'Всем привет, добро пожаловать на наш урок китайского языка!' },
      { zh: '今天我们要学习一些基本的问候语。', pinyin: 'Jīntiān wǒmen yào xuéxí yīxiē jīběn de wènhòǔǔ.', ru: 'Сегодня мы выучим несколько базовых приветствий.' },
      { zh: '请跟着我朗读：大家好。', pinyin: 'Qǐng gēnzhe wǒ lǎngdú: Dàjiā hǎo.', ru: 'Пожалуйста, читайте за мной: Дацзя хао.' },
      { zh: '很好，大家的发音都很标准。', pinyin: 'Hěn hǎo, dàjiā de fāyīn dōu hěn biāozhǔn.', ru: 'Очень хорошо, у всех стандартное произношение.' },
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % lines.length;
      setSubtitles(lines[index]);
      setTranscript(prev => [...prev.slice(-3), lines[index]]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    
    // Send to Chat
    setChatMessages(prev => [...prev, { id, user: 'Teacher Li', text: inputText, isSelf: true }]);
    
    // Trigger Danmaku
    setDanmaku(prev => [...prev, { 
      id, 
      text: inputText, 
      top: 20 + Math.random() * 40, 
      duration: 10,
      isSelf: true 
    }]);
    
    setInputText('');
    setTimeout(() => setDanmaku(prev => prev.filter(d => d.id !== id)), 10000);
  };

  // Simulate incoming danmaku
  React.useEffect(() => {
    const messages = t('language') === 'zh' 
      ? ['你好老师！', '老师讲得真好', '666', '太棒了', '大家辛苦了']
      : t('language') === 'ru'
        ? ['Здравствуйте!', 'Вау!', 'Круто!', 'Очень понятно', 'Спасибо']
        : ['Hello Teacher!', 'Amazing!', 'Great lesson', 'Love it', 'Thank you'];
        
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const text = messages[Math.floor(Math.random() * messages.length)];
      const top = Math.random() * 60 + 10;
      const duration = 8 + Math.random() * 5;
      
      setDanmaku(prev => [...prev, { id, text, top, duration }]);
      setChatMessages(prev => [...prev.slice(-15), { id, user: t('students.table_student'), text }]);
      
      setTimeout(() => {
        setDanmaku(prev => prev.filter(d => d.id !== id));
      }, duration * 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, [t]);

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
    if (!isRecording) {
      // Start Recording
      try {
        const stream = (liveMode === 'local' && screenStream) ? screenStream : localStream;
        if (!stream) {
          alert("No stream available to record. Please turn on camera or share screen.");
          return;
        }
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          try {
            await lecturesApi.upload({
              courseId: 'course-1',
              title: t('course.basic') + ' - ' + new Date().toLocaleTimeString(),
              blob,
              durationSec: Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
            });
            alert("Recording uploaded! Students can view it in schedule replays.");
          } catch (error: any) {
            console.error("Failed to upload recording", error);
            alert(error.message || "Recording stopped, but upload failed. Is the backend running?");
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
    if (screenStream) {
      stopTracks(screenStream);
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    setLiveMode('multimedia');
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate real upload
      const url = URL.createObjectURL(file);
      setPdfFile(url);
      setPdfPage(1);
      setLiveMode('multimedia');
      // In a real app we would load actual pages here
      alert(t('classroom.upload_success') || "PDF Uploaded Success! PPT/PDF is now the primary content.");
    }
  };

  // Canvas Drawing logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const pos = getPos(e);
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getPos = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('classroom.end_confirm_title')}</h3>
              <p className="text-gray-500 text-sm mb-8">{t('classroom.end_confirm_desc')}</p>
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
                  {t('classroom.end_btn')}
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
                  {[
                    { label: 'dà jiā hǎo', votes: 12, percent: 85 },
                    { label: 'dá jiā hǎo', votes: 2, percent: 10 },
                    { label: 'dà jiā hāo', votes: 1, percent: 5 },
                  ].map((option, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className={i === 0 ? 'text-[#0056D2]' : 'text-gray-600'}>{option.label}</span>
                        <span className="text-gray-400">{option.votes} votes</span>
                      </div>
                      <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100 flex">
                        <div className={`h-full transition-all duration-1000 ${i === 0 ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ width: `${option.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
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
              <h3 className="font-bold">{t('classroom.students')} (32)</h3>
              <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                      P
                    </div>
                    <div>
                      <p className="text-xs font-bold">Participant {i}</p>
                      <p className="text-[10px] text-gray-400">{t('classroom.active')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"><Mic size={14} /></button>
                    <button className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"><Video size={14} /></button>
                  </div>
                </div>
              ))}
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
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${showParticipants ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
          >
            <Users size={18} />
            <span className="hidden sm:inline">{t('classroom.students')} (32)</span>
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
                   <button 
                     onClick={stopScreenShare}
                     className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                   >
                     <X size={14} /> Stop Sharing
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-900 p-12 relative overflow-hidden rounded-b-3xl shadow-inner">
                {/* PPT/PDF Content */}
                {pdfFile ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                       <img 
                        src="https://images.unsplash.com/photo-1544717305-27a734ef1904?q=80&w=1200&auto=format&fit=crop" 
                        className="w-full h-full object-contain opacity-50 blur-sm"
                        alt="PDF Background"
                       />
                       <div className="absolute inset-0 flex flex-col items-center justify-center p-20">
                          <div className="bg-white shadow-2xl rounded-lg w-full max-w-2xl aspect-[3/4] flex flex-col p-12 border border-gray-200">
                             <h2 className="text-4xl font-bold mb-8">Lesson Plan: Page {pdfPage}</h2>
                             <div className="space-y-4">
                                <div className="h-4 bg-gray-100 rounded w-full" />
                                <div className="h-4 bg-gray-100 rounded w-5/6" />
                                <div className="h-4 bg-gray-100 rounded w-4/6" />
                             </div>
                             <div className="mt-auto flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                <span>LingoBridge Curriculum 2026</span>
                                <span>Page {pdfPage} of 42</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                      <img 
                        src="https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=1200&auto=format&fit=crop" 
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <motion.div layout className="text-center select-none z-10">
                      <h1 className="text-7xl md:text-9xl font-bold mb-8 font-noto">大家好</h1>
                      <p className="text-2xl md:text-4xl text-gray-400 font-medium italic">Dàjiā hǎo!</p>
                    </motion.div>
                  </>
                )}
              </div>
            )}

            {/* Canvas Drawing Layer (Global across modes) */}
            <canvas 
              ref={canvasRef}
              width={1200}
              height={800}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="absolute inset-0 z-40 cursor-crosshair w-full h-full pointer-events-auto"
            />

            {/* Control Sidebar (Left) */}
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
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Content Mode</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setLiveMode('local')}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            liveMode === 'local' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          Recording
                        </button>
                        <button 
                          onClick={() => setLiveMode('multimedia')}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            liveMode === 'multimedia' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          Media
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

                      {pdfFile && liveMode === 'multimedia' && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 p-2">
                           <button 
                            onClick={(e) => { e.stopPropagation(); setPdfPage(p => Math.max(1, p - 1)); }} 
                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                           >
                            <ChevronLeft size={16} />
                           </button>
                           <span className="text-[11px] font-black text-gray-700 min-w-[60px] text-center">PG {pdfPage}</span>
                           <button 
                            onClick={(e) => { e.stopPropagation(); setPdfPage(p => p + 1); }} 
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
                {liveMode === 'local' ? t('classroom.ppt_recording_mode') || 'PPT RECORDING' : t('classroom.presentation_active')}
              </div>
              
              {/* Pagination logic: Only show bottom pagination if in PPT mode */}
              {liveMode === 'local' ? (
                <div className="flex items-center gap-8 mx-auto md:mx-0">
                  <button 
                    onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Prev Slide"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="text-center min-w-[60px]">
                    <div className="text-xs font-black">{pdfPage}</div>
                    <div className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">SLIDE</div>
                  </div>
                  <button 
                    onClick={() => setPdfPage(p => p + 1)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Next Slide"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              ) : (
                <div className="flex-1" /> /* Spacer if in PDF mode */
              )}

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
                     <div className="text-[10px] font-mono text-gray-700 mt-0.5 tracking-tighter">{12+i}:30:44</div>
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
                 {isMicOn ? 'ON' : 'OFF'}
              </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white border border-white/10 uppercase tracking-tighter">
              {t('classroom.instructor')} Li
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
                      <span className={`text-[10px] font-bold ${msg.isSelf ? 'text-blue-400' : 'text-gray-400'}`}>{msg.user} {msg.isSelf && `(${t('classroom.instructor')})`}</span>
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
      </div>

      {/* Control Bar */}
      <footer className="h-20 bg-[#0F172A] border-t border-gray-800 px-4 md:px-12 flex justify-between items-center z-50">
        <div className="flex gap-4">
          <button 
            onClick={toggleMic}
            style={{ borderRadius: '22px' }}
            className={`w-12 h-12 flex items-center justify-center transition-all group relative ${isMicOn ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <Mic size={22} className={isMicOn ? 'animate-pulse' : ''} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isMicOn ? t('classroom.mute_mic') : t('classroom.unmute_mic')}
            </span>
          </button>
          <button 
            onClick={toggleCam}
            style={{ borderRadius: '22px' }}
            className={`w-12 h-12 flex items-center justify-center transition-all group relative ${isCamOn ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <Video size={22} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isCamOn ? t('classroom.stop_video') : t('classroom.start_video')}
            </span>
          </button>
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
        </div>

        <div className="flex gap-4 md:gap-8 items-center bg-white/5 px-4 md:px-8 py-2 rounded-3xl border border-white/5 shadow-inner">
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={liveMode === 'local' ? stopScreenShare : startScreenShare}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${liveMode === 'local' ? 'bg-orange-600/20 text-orange-400 border-orange-500/30' : 'bg-blue-600/20 text-blue-400 group-hover:bg-blue-600/30 border-blue-500/30'} border`}>
              <Monitor size={18} />
            </div>
            <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${liveMode === 'local' ? 'text-orange-400' : 'text-blue-400'}`}>{liveMode === 'local' ? 'STOP SHARE' : 'SHARE SCREEN'}</span>
          </div>
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setShowChat(!showChat)}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${showChat ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
              <MessageSquare size={18} />
            </div>
            <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('classroom.chat')}</span>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1 group cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center group-hover:bg-white/5 transition-all">
              <Languages size={18} />
            </div>
            <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('classroom.translate')}</span>
          </div>
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center group-hover:bg-white/5 transition-all text-gray-400">
              <Settings size={18} />
            </div>
            <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t('classroom.settings')}</span>
          </div>
        </div>

        <div className="hidden md:flex w-[140px] justify-end">
           <button 
            onClick={toggleRecording}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${isRecording ? 'bg-red-600/10 border-red-500/20' : 'bg-white/5 border-white/10 text-gray-500'}`}
           >
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-tighter ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>{t('classroom.recording')}</div>
                <div className="text-xs font-bold font-mono">{isRecording ? 'LIVE' : 'Stopped'}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-500'}`} />
           </button>
        </div>
      </footer>
    </div>
  );
};

export default TeacherClassroomView;
