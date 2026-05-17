import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Plus,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { lecturesApi, mediaUrl, type Lecture } from '../services/apiClient.ts';
import { resolveEntry } from '../services/entryResolver.ts';

interface ScheduleViewProps {
  onNavigate?: (target: string, ctx?: { lessonNodeId?: string; courseId?: string }) => void;
  lessonNodeId?: string;
}

interface ScheduleItem {
  id: number;
  day: number;
  title: string;
  time: string;
  instructor: string;
  isLive: boolean;
  courseId?: string;
  unit?: number;
  lesson?: number;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigate, lessonNodeId: _propLessonNodeId }) => {
  const { t } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'replays'>('agenda');
  const [selectedDay, setSelectedDay] = useState(30);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [replayMessage, setReplayMessage] = useState('');
  const [enteringHomework, setEnteringHomework] = useState<number | null>(null);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSynced(true);
    }, 1500);
  };

  const scheduleItems: ScheduleItem[] = [
    { id: 1, day: 30, title: t('course.basic'), time: '10:00 AM - 11:30 AM', instructor: 'Li', isLive: true, courseId: 'course-1', unit: 1, lesson: 1 },
    { id: 2, day: 30, title: t('course.vocab'), time: '02:00 PM - 03:00 PM', instructor: 'Wang', isLive: false, courseId: 'course-1', unit: 1, lesson: 2 },
    { id: 3, day: 31, title: t('course.culture'), time: '10:00 AM - 11:00 AM', instructor: 'Chen', isLive: true, courseId: 'course-1', unit: 2, lesson: 1 },
    { id: 4, day: 28, title: 'Tone Mastery', time: '09:00 AM - 10:30 AM', instructor: 'Li', isLive: false, courseId: 'course-1', unit: 1, lesson: 3 },
  ];

  useEffect(() => {
    lecturesApi.list('course-1')
      .then(setLectures)
      .catch((error) => setReplayMessage(error.message || 'Unable to load replays.'));
  }, []);

  const handleEnterHomework = async (item: ScheduleItem) => {
    if (!item.courseId || item.unit === undefined || item.lesson === undefined) {
      onNavigate?.('homework');
      return;
    }
    setEnteringHomework(item.id);
    try {
      const resolved = await resolveEntry({
        courseId: item.courseId,
        lessonNodeId: `${item.courseId}-u${item.unit}-l${item.lesson}`,
      });
      onNavigate?.('homework', { lessonNodeId: resolved.lessonNodeId, courseId: resolved.courseId });
    } catch {
      onNavigate?.('homework');
    } finally {
      setEnteringHomework(null);
    }
  };

  const filteredAgenda = scheduleItems.filter(item => item.day === selectedDay);
  const filteredRecordings = lectures
    .map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      date: new Date(lecture.createdAt).toLocaleDateString(),
      day: new Date(lecture.createdAt).getDate(),
      url: mediaUrl(lecture.videoUrl)
    }))
    .filter(rec => rec.day === selectedDay);

  return (
    <div id="schedule-view" className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.schedule_label')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('dashboard.overview')}</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            synced 
              ? 'bg-green-50 text-green-600 border border-green-100' 
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? t('schedule.syncing') : synced ? t('schedule.synced') : t('schedule.sync')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Weekly Calendar Preview */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">{t('schedule.month_year')}</h3>
            <div className="flex gap-2">
              <button className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} /></button>
              <button className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            {t('schedule.days_short').split(' ').map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(31)].map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              const hasEvents = day === 30 || day === 31 || day === 28;
              
              return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative ${
                  isSelected ? 'bg-primary-blue text-white shadow-lg' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {day}
                {hasEvents && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-blue" />
                )}
              </button>
              );
            })}
          </div>
          <div className="pt-6 border-t border-gray-100">
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('schedule.deadlines')}</h4>
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{t('course.quiz')}</p>
                    <p className="text-[10px] text-gray-500">{t('homework.today')}, 23:59</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Detailed Agenda */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{activeTab === 'agenda' ? t('schedule.upcoming') : t('schedule.replays')}</h3>
              <div className="flex bg-white rounded-lg p-1 border border-gray-100">
                <button 
                  onClick={() => setActiveTab('agenda')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'agenda' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {t('schedule.agenda')}
                </button>
                <button 
                  onClick={() => setActiveTab('replays')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'replays' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {t('schedule.replays')}
                </button>
              </div>
           </div>

           <div className="space-y-4">
              {activeTab === 'agenda' ? (
                <>
                  {filteredAgenda.length > 0 ? (
                    filteredAgenda.map((item) => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-[#0056D2] transition-colors"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`px-4 py-3 rounded-2xl text-center border transition-colors ${
                            item.isLive ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                          }`}>
                            <CalendarIcon size={20} className={item.isLive ? 'text-[#0056D2]' : 'text-gray-400'} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{item.title}</h4>
                              {item.isLive && (
                                <span className="flex items-center gap-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                  <div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                                  {t('schedule.live_badge')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                              <span className="flex items-center gap-1.5"><Clock size={14} /> {item.time}</span>
                              <span className="flex items-center gap-1.5">{t('schedule.instr')}: {item.instructor}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                          {item.isLive ? (
                            <button 
                              onClick={() => onNavigate?.('student-classroom')}
                              className="flex-1 md:flex-none px-6 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-lg shadow-blue-100 transition-all"
                            >
                              <Video size={18} />
                              {t('schedule.join_class')}
                            </button>
                          ) : (
                            <button className="flex-1 md:flex-none px-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-sm font-bold border border-gray-100 hover:bg-gray-100 transition-all">
                              {t('schedule.details')}
                            </button>
                          )}
                          <button 
                            onClick={() => handleEnterHomework(item)}
                            disabled={enteringHomework === item.id}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 hover:bg-green-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {enteringHomework === item.id ? (
                              <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                            ) : (
                              <FileText size={16} />
                            )}
                            {t('schedule.enter_homework')}
                          </button>
                          <button className="p-2.5 text-gray-400 hover:text-gray-900 border border-gray-100 rounded-xl hover:bg-gray-50">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                       <CalendarIcon size={48} className="mx-auto mb-4 text-gray-200" />
                       <p className="text-gray-400 font-bold">No classes scheduled for this day.</p>
                    </div>
                  )}
                  
                  <button 
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-bold text-sm hover:border-[#0056D2] hover:text-[#0056D2] transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    {t('schedule.add_personal')}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  {filteredRecordings.length > 0 ? (
                    filteredRecordings.map((rec: any) => (
                      <motion.div 
                        key={rec.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all"
                      >
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                               <img src="https://images.unsplash.com/photo-1544717305-27a734ef1904?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-900">{rec.title}</h4>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{rec.date}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => window.open(rec.url, '_blank')}
                           className="px-6 py-2 bg-blue-50 text-[#0056D2] rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                         >
                            {t('schedule.view_replay')}
                         </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                       <Video size={48} className="mx-auto mb-4 text-gray-200" />
                       <p className="text-gray-400 font-bold">No recordings available for this day.</p>
                       <p className="text-xs text-gray-400 mt-1">{replayMessage || 'Class recordings will appear here after they are saved by the teacher.'}</p>
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
