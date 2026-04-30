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
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';

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
  const [isRecording, setIsRecording] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(true);
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
      setChatMessages(prev => [...prev.slice(-15), { id, user: 'Student', text }]);
      
      setTimeout(() => {
        setDanmaku(prev => prev.filter(d => d.id !== id));
      }, duration * 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, [t]);

  const toggleMic = async () => {
    if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(prev => {
          if (prev) {
             stream.getAudioTracks().forEach(t => prev.addTrack(t));
             return prev;
          }
          return stream;
        });
        setIsMicOn(true);
      } catch (err) {
        console.error("Mic access denied", err);
      }
    } else {
      setIsMicOn(false);
    }
  };

  const toggleCam = async () => {
    if (!isCamOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setLocalStream(prev => {
            if (prev) {
                stream.getVideoTracks().forEach(t => prev.addTrack(t));
                return prev;
            }
            return stream;
        });
        setIsCamOn(true);
      } catch (err) {
        console.error("Camera access denied", err);
      }
    } else {
      setIsCamOn(false);
    }
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">End Class for Everyone?</h3>
              <p className="text-gray-500 text-sm mb-8">This will close the classroom for all students. Are you sure?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onExit}
                  className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  End Class
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
                  <p className="text-xs text-gray-400 font-medium tracking-wide font-noto">Interactive Assessment</p>
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
                  End Poll
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
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-xs">M</span>
            </div>
            <span className="font-bold tracking-tight">{t('classroom.course_title')}</span>
          </div>
          <div className="h-4 w-[1px] bg-gray-800" />
          <div className="flex items-center gap-2 text-xs font-bold text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            LIVE
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
          
          {/* Main Slide / Video Player Area */}
          <div className="flex-1 relative overflow-hidden bg-black flex flex-col group/ppt">
            <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-900 p-12 relative overflow-hidden rounded-b-3xl shadow-inner">
              {/* PPT Background Pattern/Image */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=1200&auto=format&fit=crop" 
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              
              {/* PPT Control Overlay for Teacher */}
              <div className="absolute top-8 left-8 z-[100] flex items-center gap-2 pointer-events-auto">
                <button 
                  onClick={() => setIsPPTLocked(!isPPTLocked)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                    isPPTLocked ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <Monitor size={14} />
                  {isPPTLocked ? 'PPT Locked for Students' : 'Students Can Browse PPT'}
                </button>
              </div>

              {/* Danmaku Layer */}
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

              <motion.div layout className="text-center select-none">
                <h1 className="text-7xl md:text-9xl font-bold mb-8 font-noto">大家好</h1>
                <p className="text-2xl md:text-4xl text-gray-400 font-medium italic">Dàjiā hǎo!</p>
                <div className="mt-16 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 w-full max-w-lg shadow-sm text-left">
                  <h3 className="text-xl font-bold mb-6 border-b border-gray-200 pb-4 text-gray-500 uppercase tracking-widest text-xs">Today's Key Vocabulary</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">1</div>
                        <span className="text-3xl font-bold">大家好</span>
                      </div>
                      <span className="text-gray-400 italic">Hello everyone</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ASR Recognition Floating Subtitles (On PPT) */}
              <div className="absolute bottom-24 inset-x-0 h-20 flex flex-col items-center justify-center z-50 px-8 pointer-events-none">
                  <motion.div 
                    key={subtitles.zh}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  >
                     <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10">
                        <p className="text-2xl font-bold text-white mb-0.5">{subtitles.zh}</p>
                        <p className="text-[10px] text-blue-300 font-bold tracking-widest uppercase mb-1">{subtitles.pinyin}</p>
                        <p className="text-lg text-gray-200 font-medium leading-tight">{subtitles.ru}</p>
                     </div>
                  </motion.div>
              </div>
            </div>

            {/* Sub-PPT Translation Tracker / Record Panel */}
            <div className="h-40 bg-[#0F172A] border-t border-gray-800 flex flex-col mt-auto z-40">
               <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 tracking-tighter uppercase whitespace-nowrap">
                     <Languages size={12} />
                     Real-time AI Transcript & Translation Record
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-bold text-gray-500 uppercase">CN-RU Pipeline Active</span>
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
                       System Ready • Analyzing Speech...
                    </div>
                  )}
               </div>
            </div>

            {/* Draggable Teacher Camera Window */}
            <motion.div 
              drag
              dragMomentum={false}
              initial={{ x: camPosition.x, y: camPosition.y }}
              onDragEnd={(_, info) => setCamPosition({ x: info.point.x, y: info.point.y })}
              className="absolute bottom-48 right-8 w-64 h-44 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500 z-[110] cursor-move active:scale-95 transition-transform"
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
                <img 
                  src="https://images.unsplash.com/photo-1544717305-27a734ef1904?q=80&w=600&auto=format&fit=crop" 
                  className="w-full h-full object-cover pointer-events-none opacity-50 grayscale" 
                  alt="Teacher sitting at computer" 
                />
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <div className={`${isMicOn ? 'bg-blue-600' : 'bg-gray-700'} rounded px-2 py-0.5 text-[9px] font-bold flex items-center gap-1 shadow-lg transition-colors`}>
                   <Mic size={10} className={isMicOn ? 'animate-pulse' : ''} />
                   {isMicOn ? 'STUDIO MIC' : 'MIC OFF'}
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">LIVE • Teacher Li</div>
            </motion.div>

            <div className="absolute bottom-44 inset-x-0 h-16 bg-black/40 backdrop-blur-md px-4 md:px-6 flex justify-between items-center text-white z-50">
              <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60">
                <Monitor size={16} />
                {isScreenSharing ? 'Screen Sharing Active' : 'Presentation Locked'}
              </div>
              <div className="flex items-center gap-6 mx-auto md:mx-0">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={24} /></button>
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
                  <h4 className="font-bold text-sm">Live Discussion</h4>
                  <div className="bg-red-500 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>
                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                 {chatMessages.map(msg => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className={`flex flex-col gap-1 ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[10px] font-bold ${msg.isSelf ? 'text-blue-400' : 'text-gray-400'}`}>{msg.user} {msg.isSelf && '(Instructor)'}</span>
                      <div className={`text-xs p-3 rounded-2xl border ${
                        msg.isSelf ? 'bg-blue-600/20 border-blue-500/20 rounded-tr-none' : 'bg-white/5 border-white/5 rounded-tl-none text-white'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                 ))}
                 {!chatMessages.length && (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs italic text-center px-4">
                       Waiting for student interaction...
                    </div>
                 )}
              </div>
              <div className="p-4 border-t border-gray-800 bg-[#0F172A]">
                 <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                       type="text" 
                       value={inputText}
                       onChange={(e) => setInputText(e.target.value)}
                       placeholder="Say something to everyone..." 
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
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative ${isMicOn ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <Mic size={22} className={isMicOn ? 'animate-pulse' : ''} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            </span>
          </button>
          <button 
            onClick={toggleCam}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative ${isCamOn ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <Video size={22} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isCamOn ? 'Stop Camera' : 'Start Camera'}
            </span>
          </button>
          <button 
             onClick={() => {
               if(isRecording) alert("Recording saved to browser! (Simulation)");
               setIsRecording(!isRecording);
             }}
             className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative ${isRecording ? 'bg-red-600/20 text-red-500 border border-red-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-red-600 mr-1 ${isRecording ? 'animate-pulse' : ''}`} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isRecording ? 'Stop Recording' : 'Record Screen'}
            </span>
          </button>
        </div>

        <div className="flex gap-4 md:gap-8 items-center bg-white/5 px-4 md:px-8 py-2 rounded-3xl border border-white/5 shadow-inner">
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setShowPoll(true)}>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-blue-600/20 text-blue-400 group-hover:bg-blue-600/30 transition-all border border-blue-500/30">
              <BarChart2 size={18} />
            </div>
            <span className="text-[8px] md:text-[9px] font-bold text-blue-400 uppercase tracking-widest">{t('classroom.poll')}</span>
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
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${isRecording ? 'bg-red-600/10 border-red-500/20' : 'bg-white/5 border-white/10 text-gray-500'}`}
           >
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase tracking-tighter ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>{t('classroom.recording')}</div>
                <div className="text-xs font-bold font-mono">{isRecording ? '01:45:22' : 'Stopped'}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-500'}`} />
           </button>
        </div>
      </footer>
    </div>
  );
};

export default TeacherClassroomView;
