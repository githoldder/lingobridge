import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ChevronRight, 
  Mic, 
  Video, 
  Monitor, 
  Maximize2, 
  ChevronLeft, 
  LogOut,
  BarChart2,
  Languages,
  Settings,
  MessageSquare,
  AlertCircle,
  Minimize2,
  Send,
  X,
  Hand
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface StudentClassroomViewProps {
  onExit: () => void;
}

const StudentClassroomView: React.FC<StudentClassroomViewProps> = ({ onExit }) => {
  const { t } = useLanguage();
  const [showChat, setShowChat] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; user: string; text: string; isSelf?: boolean }[]>([]);
  const [inputText, setInputText] = useState('');
  const [danmaku, setDanmaku] = useState<{ id: number; text: string; top: number; duration: number; isSelf?: boolean }[]>([]);
  const [subtitles, setSubtitles] = useState({ zh: '大家好，欢迎来到我们的中文课！', pinyin: 'Dàjiā hǎo, huānyíng lái dào wǒmen de Zhōngwén kè!', ru: 'Всем привет, добро пожаловать на наш урок китайского языка!' });
  const [transcript, setTranscript] = useState<{ zh: string; ru: string }[]>([]);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);

  // Interaction states
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Subtitles Simulation
  useEffect(() => {
    const lines = [
      { zh: '大家好，欢迎来到我们的中文课！', pinyin: 'Dàjiā hǎo, huānyíng lái dào wǒmen de Zhōngwén kè!', ru: 'Всем привет, добро пожаловать на наш урок китайского языка!' },
      { zh: '今天我们要学习一些基本的问候语。', pinyin: 'Jīntiān wǒmen yào xuéxí yīxiē jīběn de wènhòuyǔ.', ru: 'Сегодня мы выучим несколько базовых приветствий.' },
      { zh: '请跟着我朗读：大家好。', pinyin: 'Qǐng gēnzhe wǒ lǎngdú: Dàjiā hǎo.', ru: 'Пожалуйста, читайте за мной: Дацзя хао.' },
      { zh: '很好，大家的发音都很标准。', pinyin: 'Hěn hǎo, dàjiā de fāyīn dōu hěn biāozhǔn.', ru: 'Очень хорошо, у всех стандартное произношение.' },
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % lines.length;
      setSubtitles(lines[index]);
      setTranscript(prev => [...prev.slice(-4), lines[index]]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Danmaku Simulation (External)
  useEffect(() => {
    const messages = t('language') === 'zh' 
      ? ['老师讲得真清晰', '666', '太棒太棒了', '打卡学习', '支持老师']
      : t('language') === 'ru'
        ? ['Очень интересно', 'Класс!', 'Спасибо за урок', 'Все понятно']
        : ['Great explanation', 'Love this!', 'Super clear', 'Learning a lot', 'Hi from Italy!'];
        
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const text = messages[Math.floor(Math.random() * messages.length)];
      setDanmaku(prev => [...prev, { id, text, top: Math.random() * 40 + 10, duration: 8 + Math.random() * 4 }]);
      setChatMessages(prev => [...prev.slice(-15), { id, user: t('students.table_student'), text }]);
      setTimeout(() => setDanmaku(prev => prev.filter(d => d.id !== id)), 12000);
    }, 6000);

    return () => clearInterval(interval);
  }, [t]);

  // Fullscreen toggle
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
    setChatMessages(prev => [...prev, { id, user: 'Anna Zhang', text: inputText, isSelf: true }]);
    
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

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      alert("Recording saved to browser! (Simulation)");
    }
  };

  const toggleHandRaise = () => {
    if (!isHandRaised) {
      setIsHandRaised(true);
      // Simulate teacher accepting after 3 seconds
      setTimeout(() => {
        if (confirm("Teacher Li has invited you to turn on your camera and mic. Accept?")) {
          setIsHandRaised(false);
          setIsConnected(true);
        }
      }, 3000);
    } else {
      setIsHandRaised(false);
      setIsConnected(false);
      stopMedia();
    }
  };

  const stopMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsMicOn(false);
    setIsCamOn(false);
  };

  const toggleMic = async () => {
    if (!isConnected) return;
    if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (localStream) {
          stream.getAudioTracks().forEach(track => localStream.addTrack(track));
        } else {
          setLocalStream(stream);
        }
        setIsMicOn(true);
      } catch (err) {
        console.error("Mic access denied", err);
      }
    } else {
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      setIsMicOn(false);
    }
  };

  const toggleCam = async () => {
    if (!isConnected) return;
    if (!isCamOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (localStream) {
          stream.getVideoTracks().forEach(track => localStream.addTrack(track));
        } else {
          setLocalStream(stream);
        }
        setIsCamOn(true);
      } catch (err) {
        console.error("Camera access denied", err);
      }
    } else {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
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
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('classroom.leave_confirm_title')}</h3>
              <p className="text-gray-500 text-sm mb-8">{t('classroom.leave_confirm_desc')}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {t('classroom.cancel')}
                </button>
                <button 
                  onClick={onExit}
                  className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  {t('classroom.leave')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 px-6 border-b border-gray-800 flex justify-between items-center bg-[#0F172A] z-50">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-xs">S</span>
            </div>
            <span className="font-bold tracking-tight">{t('classroom.course_title')}</span>
          </div>
          <div className="h-4 w-[1px] bg-gray-800" />
          <div className="flex items-center gap-2 text-xs font-bold text-green-500">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             {t('classroom.live_stream')}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="bg-white/5 hover:bg-red-600/20 text-gray-300 hover:text-red-500 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">{t('classroom.leave')}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content (PPT + Danmaku) */}
        <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
          {/* Danmaku Container */}
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
             {danmaku.map((d) => (
                <motion.div
                  key={d.id}
                  initial={{ x: '100vw' }}
                  animate={{ x: '-100vw' }}
                  transition={{ duration: d.duration, ease: 'linear' }}
                  style={{ top: `${d.top}%` }}
                  className={`absolute whitespace-nowrap font-bold text-lg md:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-2 px-6 py-2 rounded-full backdrop-blur-md border ${
                    d.isSelf ? 'bg-blue-600/80 text-white border-blue-400' : 'bg-black/40 text-white border-white/10'
                  }`}
                >
                  {d.isSelf && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                  {d.text}
                </motion.div>
             ))}
          </div>

          {/* PPT / Main Video Area */}
          <div className="flex-1 bg-white flex flex-col items-center justify-center p-12 text-gray-900 select-none overflow-hidden rounded-b-3xl relative shadow-inner">
            {/* PPT Background Pattern/Image */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <img 
                src="https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=1200&auto=format&fit=crop" 
                className="w-full h-full object-cover"
                alt=""
              />
            </div>
             <motion.div layout className="text-center">
                <h1 className="text-7xl md:text-9xl font-bold mb-8 font-noto">大家好</h1>
                <p className="text-2xl md:text-4xl text-gray-400 font-medium italic">Dàjiā hǎo!</p>
                
                <div className="mt-16 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 w-full max-w-lg shadow-sm text-left">
                  <h3 className="text-xl font-bold mb-6 border-b border-gray-200 pb-4 text-gray-500 uppercase tracking-widest text-xs">{t('classroom.key_vocab')}</h3>
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
          </div>

          {/* Teacher Picture-in-Picture */}
          <div className="absolute bottom-32 right-8 w-48 h-32 md:w-64 md:h-44 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500 z-40 transition-all hover:scale-105">
             <img src="https://images.unsplash.com/photo-1544717305-27a734ef1904?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Teacher speaking" />
             <div className="absolute bottom-2 left-2 bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-lg">LIVE • {t('classroom.instructor')} Li</div>
             <div className="absolute top-2 right-2 flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
             </div>
          </div>

          {/* Local Student Video (Picture-in-Picture) */}
          <AnimatePresence>
            {isCamOn && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-32 left-8 w-48 h-32 md:w-64 md:h-44 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-green-500 z-40 transition-all hover:scale-105 cursor-move"
              >
                 <video 
                   autoPlay 
                   playsInline 
                   muted 
                   ref={(el) => {
                     if (el && localStream) el.srcObject = localStream;
                   }}
                   className="w-full h-full object-cover scale-x-[-1]"
                 />
                 <div className="absolute bottom-2 left-2 bg-green-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-lg uppercase tracking-tighter">{t('classroom.you_on_stage')}</div>
                 <div className="absolute top-2 right-2 flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-white shadow-sm">{t('classroom.rec')}</span>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ASR Rolling Subtitles Overlay (On PPT) */}
          <div className="absolute bottom-24 inset-x-0 h-20 flex flex-col items-center justify-center z-50 px-8 pointer-events-none">
              <motion.div 
                key={subtitles.zh}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              >
                 <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10">
                    <p className="text-xl md:text-2xl font-bold text-white mb-0.5">{subtitles.zh}</p>
                    <p className="text-[10px] md:text-xs text-blue-300 font-bold tracking-widest uppercase mb-1">{subtitles.pinyin}</p>
                    <p className="text-base md:text-lg text-gray-200 font-medium leading-tight">{subtitles.ru}</p>
                 </div>
              </motion.div>
          </div>

          {/* Real-time Node Records / Translator (Below PPT) */}
          <div className="h-32 bg-[#0F172A] border-t border-gray-800 flex flex-col mt-auto z-40">
             <div className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-tighter uppercase">
                   <Languages size={12} className="text-blue-400" />
                   {t('classroom.transcript_title')}
                </div>
                <div className="flex gap-4">
                  <span className="text-[10px] font-bold text-gray-500">{t('classroom.cn_ru_active')}</span>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-3">
                {transcript.map((line, i) => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={i} className="flex gap-4 items-start">
                    <div className="text-[10px] font-mono text-gray-600 mt-0.5">{10 + i}:00</div>
                    <div className="flex-1 grid grid-cols-2 gap-8">
                       <p className="text-xs text-white/80 font-medium border-l-2 border-blue-500/30 pl-3">{line.zh}</p>
                       <p className="text-xs text-gray-400 italic border-l-2 border-white/10 pl-3 leading-relaxed">{line.ru}</p>
                    </div>
                  </motion.div>
                ))}
                {!transcript.length && (
                  <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">
                    {t('classroom.system_ready')}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Side Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#0F172A] border-l border-gray-800 flex flex-col overflow-hidden"
            >
              <div className="h-16 px-6 border-b border-gray-800 flex items-center justify-between shrink-0">
                <h4 className="font-bold text-sm">{t('classroom.live_discussion')}</h4>
                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                 {chatMessages.map(msg => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className={`flex flex-col gap-1 ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[10px] font-bold ${msg.isSelf ? 'text-blue-400' : 'text-gray-400'}`}>{msg.user} {msg.isSelf && `(${t('classroom.you')})`}</span>
                      <div className={`text-xs p-3 rounded-2xl border ${
                        msg.isSelf ? 'bg-blue-600/20 border-blue-500/20 rounded-tr-none' : 'bg-white/5 border-white/5 rounded-tl-none text-white'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                 ))}
                 {!chatMessages.length && (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs italic text-center px-4">
                       {t('classroom.start_conversation')}
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

      {/* Footer Controls */}
      <footer className="h-20 bg-[#0F172A] border-t border-gray-800 px-6 md:px-12 flex justify-between items-center z-50">
        <div className="flex gap-4">
          <button 
            onClick={toggleMic}
            disabled={!isConnected}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative border ${
              !isConnected 
                ? 'bg-white/5 text-gray-600 border-transparent cursor-not-allowed' 
                : isMicOn 
                  ? 'bg-blue-600 text-white border-blue-400' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/5'
            }`}
          >
            <Mic size={22} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {!isConnected ? t('classroom.hand_raise_required') : isMicOn ? t('classroom.mute_mic') : t('classroom.unmute_mic')}
            </span>
          </button>
          
          <button 
            onClick={toggleCam}
            disabled={!isConnected}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative border ${
              !isConnected 
                ? 'bg-white/5 text-gray-600 border-transparent cursor-not-allowed' 
                : isCamOn 
                  ? 'bg-blue-600 text-white border-blue-400' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/5'
            }`}
          >
            <Video size={22} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {!isConnected ? t('classroom.hand_raise_required') : isCamOn ? t('classroom.stop_video') : t('classroom.start_video')}
            </span>
          </button>

          <button 
            onClick={toggleHandRaise}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative border ${
              isHandRaised 
                ? 'bg-orange-600 text-white border-orange-400 animate-pulse' 
                : isConnected
                  ? 'bg-green-600 text-white border-green-400 font-bold'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/5'
            }`}
          >
            {isConnected ? <Users size={22} /> : <Hand size={22} />}
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-normal">
              {isConnected ? t('classroom.on_stage') : isHandRaised ? t('classroom.waiting_teacher') : t('classroom.raise_hand')}
            </span>
          </button>
          
          <button 
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative ${isRecording ? 'bg-red-600/20 text-red-500 border border-red-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-red-600 mr-1 ${isRecording ? 'animate-pulse' : ''}`} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isRecording ? t('classroom.stop_recording') : t('classroom.record_lesson')}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-6 bg-white/5 px-8 py-2 rounded-full border border-white/5">
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`flex flex-col items-center gap-1 group ${showChat ? 'text-blue-400' : 'text-gray-500'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showChat ? 'bg-blue-400/20' : 'hover:bg-white/5'}`}>
              <MessageSquare size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{t('classroom.chat')}</span>
          </button>
          <button className="flex flex-col items-center gap-1 group text-gray-500">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all">
                <Languages size={20} />
             </div>
             <span className="text-[9px] font-bold uppercase tracking-widest">{t('classroom.translate')}</span>
          </button>
          <button className="flex flex-col items-center gap-1 group text-gray-500" onClick={() => alert("Simulation: Results visible to all students")}>
             <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all">
                <BarChart2 size={20} />
             </div>
             <span className="text-[9px] font-bold uppercase tracking-widest">{t('classroom.poll')}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
           <button 
            onClick={toggleFullscreen}
            className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all group relative"
          >
            {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isFullscreen ? t('classroom.exit_fullscreen') : t('classroom.fullscreen')}
            </span>
          </button>
          <button className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all group relative text-gray-400">
            <Settings size={22} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default StudentClassroomView;
