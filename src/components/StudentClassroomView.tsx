import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  LogOut,
  Mic,
  Play,
  StopCircle,
  Trash2,
  Volume2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { coursesApi, mediaUrl, recordingsApi, type CoursePage, type Exercise, type Recording } from '../services/apiClient.ts';
import { ttsService } from '../services/ttsService.ts';

interface StudentClassroomViewProps {
  onExit: () => void;
}

const COURSE_ID = 'course-1';

const StudentClassroomView: React.FC<StudentClassroomViewProps> = ({ onExit }) => {
  const { t } = useLanguage();
  const [pages, setPages] = useState<CoursePage[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [message, setMessage] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const currentPage = pages[pageIndex];
  const currentPageNumber = currentPage?.pageNumber || 1;

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pageData, exerciseData, recordingData] = await Promise.all([
        coursesApi.pages(COURSE_ID),
        coursesApi.exercises(COURSE_ID),
        recordingsApi.list(COURSE_ID, currentPageNumber)
      ]);
      setPages(pageData);
      setExercises(exerciseData);
      setRecordings(recordingData);
    } catch (error: any) {
      setMessage(error.message || 'Unable to load course data. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecordings = async (pageNumber = currentPageNumber) => {
    try {
      setRecordings(await recordingsApi.list(COURSE_ID, pageNumber));
    } catch (error: any) {
      setMessage(error.message || 'Unable to load recordings.');
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      stopTimer();
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (currentPage) loadRecordings(currentPage.pageNumber);
  }, [pageIndex]);

  const startRecording = async () => {
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stopStream();
        stopTimer();
        setIsRecording(false);
        try {
          await recordingsApi.upload({
            courseId: COURSE_ID,
            pageNumber: currentPageNumber,
            blob,
            durationSec: recordingTime,
            filename: `student-page-${currentPageNumber}-${Date.now()}.webm`
          });
          setMessage('Recording uploaded.');
          await loadRecordings(currentPageNumber);
        } catch (error: any) {
          setMessage(error.message || 'Recording upload failed.');
        }
      };
      recorder.start();
      setRecordingTime(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((value) => value + 1);
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage('Please allow microphone access to record.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const deleteRecording = async (id: string) => {
    await recordingsApi.delete(id);
    await loadRecordings(currentPageNumber);
  };

  const exit = () => {
    stopRecording();
    stopStream();
    onExit();
  };

  return (
    <div id="classroom-view" className="fixed inset-0 bg-[#0F172A] text-white z-[60] flex flex-col font-sans">
      <header className="h-16 px-6 border-b border-gray-800 flex justify-between items-center bg-[#0F172A] z-50">
        <div className="flex items-center gap-4">
          <button onClick={exit} className="p-2 rounded-lg hover:bg-white/10 text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="font-bold tracking-tight">{t('classroom.course_title')}</div>
            <div className="text-[10px] uppercase tracking-widest text-green-400">Practice mode</div>
          </div>
        </div>
        <button onClick={exit} className="bg-white/5 hover:bg-red-600/20 text-gray-300 hover:text-red-500 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
          <LogOut size={18} />
          {t('classroom.leave')}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-100 text-gray-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black">第三课：自我介绍</h1>
                <p className="text-sm text-gray-500 font-bold">Page {currentPageNumber} / {pages.length || 1}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
                  className="p-3 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => setPageIndex((value) => Math.min(pages.length - 1, value + 1))}
                  className="p-3 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[520px] flex items-center justify-center text-gray-400 font-bold">
                <Loader2 className="animate-spin mr-2" /> Loading course...
              </div>
            ) : (
              <div className="min-h-[520px] p-8 md:p-12 flex flex-col justify-center items-center bg-gradient-to-br from-white to-blue-50">
                <motion.div
                  key={currentPage?.id || pageIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-3xl text-center"
                >
                  <div className="mx-auto mb-8 w-16 h-16 rounded-2xl bg-blue-100 text-[#0056D2] flex items-center justify-center">
                    <FileText size={32} />
                  </div>
                  <div
                    className="prose prose-lg mx-auto text-gray-900"
                    dangerouslySetInnerHTML={{ __html: currentPage?.contentHtml || '<h1>No course page yet</h1>' }}
                  />
                  <p className="mt-8 text-2xl md:text-4xl font-black text-gray-900 font-noto">{currentPage?.audioText || '大家好'}</p>
                  {currentPage?.fileUrl && (
                    <a className="inline-flex mt-6 text-sm font-bold text-[#0056D2] hover:underline" href={mediaUrl(currentPage.fileUrl)} target="_blank" rel="noreferrer">
                      Open uploaded courseware
                    </a>
                  )}
                </motion.div>
              </div>
            )}

            <div className="p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={() => ttsService.speak(currentPage?.audioText || '大家好', 'zh-CN')}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#0056D2] text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <Volume2 size={20} />
                {t('homework.model_answer') || 'Read this page'}
              </button>
              {!isRecording ? (
                <button onClick={startRecording} className="w-full md:w-auto px-6 py-3 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-700">
                  <Mic size={20} />
                  {t('homework.ready') || 'Record'}
                </button>
              ) : (
                <button onClick={stopRecording} className="w-full md:w-auto px-6 py-3 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2">
                  <StopCircle size={20} />
                  Stop 00:{recordingTime.toString().padStart(2, '0')}
                </button>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-black text-gray-900 mb-4">Practice from Excel</h2>
              <div className="space-y-3">
                {exercises.length > 0 ? exercises.map((exercise) => (
                  <div key={exercise.id} className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-sm font-bold text-gray-900">{exercise.prompt}</p>
                    <p className="text-xs text-gray-500 mt-1">Page {exercise.pageNumber}</p>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 font-bold">No Excel exercises uploaded yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-black text-gray-900 mb-1">My recordings</h2>
              <p className="text-xs text-gray-500 mb-4">Page {currentPageNumber}</p>
              {message && <div className="mb-4 rounded-xl bg-blue-50 text-[#0056D2] px-4 py-3 text-xs font-bold">{message}</div>}
              <div className="space-y-3">
                {recordings.length > 0 ? recordings.map((recording) => (
                  <div key={recording.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{new Date(recording.createdAt).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{recording.durationSec || 0}s</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => new Audio(mediaUrl(recording.audioUrl)).play()} className="p-2 rounded-lg bg-white text-[#0056D2] border border-gray-100">
                          <Play size={16} />
                        </button>
                        <a href={mediaUrl(recording.audioUrl)} download={recording.filename} className="p-2 rounded-lg bg-white text-gray-600 border border-gray-100">
                          <Download size={16} />
                        </a>
                        <button onClick={() => deleteRecording(recording.id)} className="p-2 rounded-lg bg-white text-red-600 border border-gray-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 font-bold">No recordings yet. Record your pronunciation first.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default StudentClassroomView;
