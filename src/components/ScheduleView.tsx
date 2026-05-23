import React, { useEffect, useState, useCallback } from 'react';
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
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { coursesApi, lessonNodesApi, lecturesApi, liveSessionsApi, mediaUrl, type Course, type LessonNodeData, type LiveSessionData } from '../services/apiClient.ts';

interface ScheduleViewProps {
  onNavigate?: (target: string, ctx?: { lessonNodeId?: string; courseId?: string }) => void;
  lessonNodeId?: string;
}

interface AgendaItem {
  id: string;
  courseId: string;
  lessonNodeId: string;
  title: string;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  instructor: string;
  isLive: boolean;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'agenda' | 'replays'>('agenda');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveSessions, setLiveSessions] = useState<Map<string, LiveSessionData>>(new Map());

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const courses = await coursesApi.list();

        const items: AgendaItem[] = [];
        const allLectures: any[] = [];
        const liveMap = new Map<string, LiveSessionData>();

        for (const course of courses) {
          const [nodes, active] = await Promise.all([
            lessonNodesApi.list(course.id),
            liveSessionsApi.getActive(course.id).catch(() => null),
          ]);

          const courseTitle = course.title;
          for (const node of nodes) {
            items.push({
              id: node.id,
              courseId: course.id,
              lessonNodeId: node.id,
              title: node.title || courseTitle,
              startsAt: node.startsAt,
              endsAt: node.endsAt,
              createdAt: (node as any).createdAt,
              instructor: course.teacherId,
              isLive: active?.lessonNodeId === node.id && (active.status === 'active' || active.status === 'scheduled'),
            });
          }

          if (active) liveMap.set(course.id, active);

          const courseLectures = await lecturesApi.list(course.id).catch(() => []);
          for (const lec of courseLectures) {
            allLectures.push({
              id: lec.id,
              title: lec.title,
              date: new Date(lec.createdAt).toLocaleDateString(),
              day: new Date(lec.createdAt).getDate(),
              url: mediaUrl(lec.videoUrl),
              courseTitle,
            });
          }
        }

        if (!cancelled) {
          items.sort((a, b) => {
            const aTime = a.startsAt || a.createdAt || '';
            const bTime = b.startsAt || b.createdAt || '';
            return aTime.localeCompare(bTime);
          });
          setAgenda(items);
          setLectures(allLectures);
          setLiveSessions(liveMap);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load schedule');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleEnterLive = useCallback(async (item: AgendaItem) => {
    try {
      const session = await liveSessionsApi.getActive(item.courseId);
      if (!session) return;
      await liveSessionsApi.join(session.id);
      onNavigate?.('student-classroom', { lessonNodeId: item.lessonNodeId, courseId: item.courseId });
    } catch {
      // no active session or not authorized
    }
  }, [onNavigate]);

  const handleEnterClassroom = useCallback(async (item: AgendaItem) => {
    // Enter classroom even without active live session (self-study mode)
    localStorage.setItem('lingobridge_courseId', item.courseId);
    localStorage.setItem('lingobridge_lessonNodeId', item.lessonNodeId);
    onNavigate?.('student-classroom', { lessonNodeId: item.lessonNodeId, courseId: item.courseId });
  }, [onNavigate]);

  const handleEnterHomework = useCallback(async (item: AgendaItem) => {
    onNavigate?.('homework', { lessonNodeId: item.lessonNodeId, courseId: item.courseId });
  }, [onNavigate]);

  const filteredAgenda = agenda.filter((item) => {
    if (item.isLive || !item.startsAt) return true;
    const day = new Date(item.startsAt).getDate();
    return day === selectedDay;
  });

  const filteredRecordings = lectures.filter(rec => rec.day === selectedDay);

  const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  return (
    <div id="schedule-view" className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.schedule_label')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('dashboard.overview')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">{currentYear}年{currentMonth + 1}月</h3>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            {t('schedule.days_short').split(' ').map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              const hasEvents = agenda.some((item) => item.startsAt && new Date(item.startsAt).getDate() === day);
              
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
          </div>
        </div>

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
            {loading ? (
              <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-[#0056D2] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 font-bold">{t('homework.loading')}</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">{error}</p>
              </div>
            ) : activeTab === 'agenda' ? (
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
                              <span className="flex items-center gap-1.5">
                                <Clock size={14} /> 
                                {item.startsAt ? new Date(item.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (item.isLive ? t('schedule.live_badge') : t('schedule.unscheduled') || 'Ready')}
                                {item.endsAt ? ` - ${new Date(item.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                          {item.isLive ? (
                            <button 
                              onClick={() => handleEnterLive(item)}
                              className="flex-1 md:flex-none px-6 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-lg shadow-blue-100 transition-all"
                            >
                              <Video size={18} />
                              {t('schedule.join_class')}
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleEnterClassroom(item)}
                              className="flex-1 md:flex-none px-6 py-2.5 bg-blue-50 text-[#0056D2] rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                            >
                              <BookOpen size={18} />
                              {t('schedule.enter_classroom') || 'Enter Classroom'}
                            </button>
                          )}
                          <button 
                            onClick={() => handleEnterHomework(item)}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 hover:bg-green-100 transition-all flex items-center justify-center gap-1.5"
                          >
                            <FileText size={16} />
                            {t('schedule.enter_homework')}
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                       <CalendarIcon size={48} className="mx-auto mb-4 text-gray-200" />
                       <p className="text-gray-400 font-bold">{t('schedule.no_classes') || 'No classes scheduled for this day.'}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {lectures.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                       <Video size={48} className="mx-auto mb-4 text-gray-200" />
                       <p className="text-gray-400 font-bold">{t('schedule.no_recordings') || 'No recordings available.'}</p>
                       <p className="text-xs text-gray-400 mt-1">{t('schedule.recordings_hint') || 'Class recordings will appear here after they are saved by the teacher.'}</p>
                    </div>
                  ) : filteredRecordings.length > 0 ? (
                    filteredRecordings.map((rec: any) => (
                      <motion.div 
                        key={rec.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all"
                      >
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                               <BookOpen size={24} className="text-gray-400" />
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-900">{rec.title}</h4>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{rec.date} · {rec.courseTitle}</p>
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
                       <p className="text-gray-400 font-bold">{t('schedule.no_recordings') || 'No recordings available for this day.'}</p>
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
