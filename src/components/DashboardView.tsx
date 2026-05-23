import React from 'react';
import { 
  Trophy, 
  Flame, 
  Star, 
  ArrowRight, 
  BookOpen, 
  Video, 
  ClipboardList,
  Clock,
  Calendar,
  BarChart,
  ChevronRight,
  TrendingUp,
  User as UserIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { coursesApi, liveSessionsApi, lessonNodesApi } from '../services/apiClient.ts';

interface DashboardViewProps {
  onNavigate?: (target: string, ctx?: { courseId?: string; lessonNodeId?: string }) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [liveInfo, setLiveInfo] = React.useState<{ courseId: string; lessonNodeId: string } | null>(null);
  const [courses, setCourses] = React.useState<Array<{ id: string; title: string; exercisesCount?: number; pagesCount?: number }>>([]);
  const [homeworkInfo, setHomeworkInfo] = React.useState<{ courseId: string; lessonNodeId: string; title: string } | null>(null);

  React.useEffect(() => {
    const fetchLiveContext = async () => {
      try {
        const courses = await coursesApi.list();
        setCourses(courses);
        if (!courses || courses.length === 0) return;

        // 1. Try finding active live session
        for (const course of courses) {
          const activeSession = await liveSessionsApi.getActive(course.id);
          if (activeSession && activeSession.status === 'active') {
            const lessonNodeId = (activeSession as any).lessonNodeId;
            if (lessonNodeId) {
              setLiveInfo({ courseId: course.id, lessonNodeId });
              return;
            }
          }
        }

        // 2. Fallback to latest lesson node of the first course
        const firstCourse = courses[0];
        const nodes = await lessonNodesApi.list(firstCourse.id);
        if (nodes && nodes.length > 0) {
          const latestNode = nodes[nodes.length - 1];
          setLiveInfo({ courseId: firstCourse.id, lessonNodeId: latestNode.id });
          setHomeworkInfo({ courseId: firstCourse.id, lessonNodeId: latestNode.id, title: latestNode.title || firstCourse.title });
        }
      } catch (err) {
        console.error('Failed to load student live context:', err);
      }
    };
    fetchLiveContext();
  }, []);

  const handleJoinClassroom = () => {
    if (liveInfo) {
      localStorage.setItem('lingobridge_courseId', liveInfo.courseId);
      localStorage.setItem('lingobridge_lessonNodeId', liveInfo.lessonNodeId);
      onNavigate?.('student-classroom', { courseId: liveInfo.courseId, lessonNodeId: liveInfo.lessonNodeId });
    } else {
      onNavigate?.('student-classroom');
    }
  };

  const handleOpenHomework = () => {
    if (homeworkInfo) {
      localStorage.setItem('lingobridge_courseId', homeworkInfo.courseId);
      localStorage.setItem('lingobridge_lessonNodeId', homeworkInfo.lessonNodeId);
      onNavigate?.('homework', { courseId: homeworkInfo.courseId, lessonNodeId: homeworkInfo.lessonNodeId });
    } else {
      onNavigate?.('homework');
    }
  };

  const activeCourse = courses[0];
  const totalHomework = courses.reduce((sum, course) => sum + (course.exercisesCount || 0), 0);
  const totalPages = courses.reduce((sum, course) => sum + (course.pagesCount || 0), 0);

  return (
    <div id="dashboard-view" className="space-y-8">
      {/* Welcome & Stats Hero */}
      <section id="dashboard-hero" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="hero-welcome" className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative p-8">
          <div className="relative z-10">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t('dashboard.greeting', { name: user?.displayName || t('auth.guest') })} 👋</h1>
            <p className="text-xs md:text-sm text-gray-600 mb-6 max-w-sm">{t('dashboard.quote')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#0056D2] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                {activeCourse?.title || t('dashboard.continue')}
              </button>
              <button 
                onClick={() => onNavigate?.('schedule')}
                className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                {t('dashboard.schedule_label')}
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-50/50 -skew-x-12 translate-x-10 pointer-events-none" />
          <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <BookOpen size={180} className="text-[#0056D2]" />
          </div>
        </div>

        <div id="hero-stats" className="flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Flame size={24} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dashboard.streak')}</p>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-2xl font-bold text-gray-900">{courses.length}</span>
                <span className="text-xs text-gray-500">{t('nav.courses')}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-[#0056D2] flex items-center justify-center shrink-0">
              <Trophy size={24} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dashboard.points')}</p>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-2xl font-bold text-gray-900">{totalHomework}</span>
                <span className="text-xs text-gray-500">{t('homework.title')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Tasks */}
      <section id="today-tasks">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('dashboard.schedule_label')}</h2>
          <button className="text-[#0056D2] text-sm font-semibold flex items-center gap-1 hover:underline">
            {t('dashboard.view_all_action')} <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-50 text-[#0056D2] rounded-xl">
                <BookOpen size={24} />
              </div>
              <span className="bg-blue-100 text-[#0056D2] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">+10 {t('stats.pts')}</span>
            </div>
            <p className="text-xs font-semibold text-[#0056D2] mb-1">{t('dashboard.task.preview')}</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{activeCourse?.title || t('dashboard.task.prep_family')}</h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2">{totalPages > 0 ? `${totalPages} ${t('classroom.slide')}` : t('schedule.no_classes')}</p>
            <button onClick={() => onNavigate?.('schedule')} className="w-full bg-[#0056D2] text-white py-2.5 rounded-lg font-semibold text-sm group-hover:bg-blue-700 transition-colors">
              {t('dashboard.task.start')}
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 py-1 px-8 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rotate-45 translate-x-6 translate-y-3 shadow-sm">
              {t('dashboard.task.live_soon')}
            </div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Video size={24} />
              </div>
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider mr-6">+20 {t('stats.pts')}</span>
            </div>
            <p className="text-xs font-semibold text-orange-600 mb-1">{t('dashboard.task.reminder')}</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{homeworkInfo?.title || activeCourse?.title || t('dashboard.task.live_lesson')}</h3>
            <div className="flex items-center gap-2 mb-6">
              <Clock size={14} className="text-orange-500" />
              <p className="text-sm text-orange-600 font-medium">{liveInfo ? t('schedule.live_badge') : t('schedule.enter_classroom')}</p>
            </div>
            <button 
              onClick={handleJoinClassroom}
              className="w-full bg-[#0056D2] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              {t('dashboard.join_classroom')}
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <ClipboardList size={24} />
              </div>
              <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">+15 {t('stats.pts')}</span>
            </div>
            <p className="text-xs font-semibold text-green-600 mb-1">{t('dashboard.task.homework')}</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{homeworkInfo?.title || t('dashboard.task.review_ch2')}</h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2">{totalHomework > 0 ? `${totalHomework} ${t('homework.title')}` : t('homework.no_tasks')}</p>
            <button onClick={handleOpenHomework} className="w-full bg-[#0056D2] text-white py-2.5 rounded-lg font-semibold text-sm group-hover:bg-blue-700 transition-colors">
              {t('dashboard.task.submit')}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Access */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">{t('dashboard.quick_access')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => onNavigate?.('schedule')} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <Calendar size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.my_schedule')}</span>
            </button>
            <button onClick={() => onNavigate?.('schedule')} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <BarChart size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.week_stats')}</span>
            </button>
            <button onClick={() => onNavigate?.('homework', homeworkInfo || undefined)} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <BookOpen size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.char_lab')}</span>
            </button>
            <button onClick={handleJoinClassroom} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <TrendingUp size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.live_events')}</span>
            </button>
          </div>
        </div>

        {/* Real Course Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{t('nav.courses')}</h2>
            <button onClick={() => onNavigate?.('schedule')} className="text-[#0056D2] text-xs font-semibold hover:underline">{t('dashboard.view_all_action')}</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
            {courses.length > 0 ? courses.slice(0, 4).map((course) => (
              <button
                key={course.id}
                onClick={() => onNavigate?.('schedule')}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 text-left hover:border-[#0056D2] hover:bg-blue-50/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{course.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{course.pagesCount || 0} {t('classroom.slide')} · {course.exercisesCount || 0} {t('homework.title')}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0" />
              </button>
            )) : (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">{t('schedule.no_classes')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
