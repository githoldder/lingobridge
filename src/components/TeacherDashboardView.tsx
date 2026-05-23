import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Play
} from 'lucide-react';
import { motion } from 'motion/react';

import { useLanguage } from '../context/LanguageContext.tsx';
import { coursesApi, courseMembersApi, homeworkApi, type Course } from '../services/apiClient.ts';

interface TeacherDashboardViewProps {
  onNavigate?: (target: string) => void;
}

const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentSeats, setStudentSeats] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await coursesApi.list().catch(() => []);
      const [members, tasks] = await Promise.all([
        Promise.all(data.map((course) => courseMembersApi.list(course.id).catch(() => []))),
        Promise.all(data.map((course) => homeworkApi.tasks(course.id, { includeAll: true }).catch(() => []))),
      ]);
      if (!active) return;
      setCourses(data);
      setStudentSeats(members.flat().length);
      setTaskCount(tasks.flat().length);
    }
    load();
    return () => { active = false; };
  }, []);

  const stats = [
    { label: t('nav.students'), value: String(studentSeats), icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: t('nav.courses'), value: String(courses.length), icon: BookOpen, color: 'bg-red-50 text-red-600' },
    { label: t('course_homework.tasks_parsed'), value: String(taskCount), icon: Clock, color: 'bg-green-50 text-green-600' },
    { label: t('nav.reports'), value: courses.length > 0 ? t('course.published') : t('course.draft'), icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  const upcomingClasses = useMemo(() => courses.slice(0, 3).map((course) => ({
    id: course.id,
    time: course.createdAt ? new Date(course.createdAt).toLocaleDateString() : '',
    title: course.title,
    level: course.status,
    students: 0,
  })), [courses]);

  return (
    <div id="teacher-dashboard" className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{t('dashboard.greeting_teacher')}</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">{t('dashboard.overview')}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate?.('teacher-courses')}
            className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t('dashboard.schedule')}
          </button>
          <button 
            onClick={() => onNavigate?.('teacher-courses')}
            className="flex-1 md:flex-none px-6 py-2 bg-[#0056D2] text-white rounded-xl text-sm font-bold hover:shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
          >
            <Play size={18} fill="currentColor" />
            <span className="whitespace-nowrap">{t('nav.courses')}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Classes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-[#0056D2]" />
              {t('dashboard.schedule_label')}
            </h3>
            <button className="text-sm font-bold text-[#0056D2] hover:underline">{t('dashboard.view_all_action')}</button>
          </div>
          
          <div className="space-y-4">
            {upcomingClasses.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 font-bold">
                {t('course.loading')}
              </div>
            ) : upcomingClasses.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate?.('teacher-courses')}
                className="w-full text-left bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-[#0056D2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="bg-gray-50 px-3 py-2 md:px-4 md:py-3 rounded-2xl text-center border border-gray-100 group-hover:bg-blue-50 transition-colors min-w-[60px]">
                    <div className="text-[10px] md:text-xs font-black text-[#0056D2]">{t('course.created')}</div>
                    <div className="text-xs font-black text-gray-900 leading-none">{item.time}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm md:text-base">{item.title}</h4>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium">{item.level} • {item.students} {t('classroom.students')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-stretch sm:self-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 truncate px-1">S{n}</div>
                    ))}
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-[#0056D2]" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar: Analytics & Notifications */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 font-noto">{t('teacher.weekly_engagement')}</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                   <span>{t('teacher.quiz_completion')}</span>
                  <span className="text-gray-900">{taskCount}</span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, taskCount * 10)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  <span>{t('teacher.student_satisfaction')}</span>
                  <span className="text-gray-900">{studentSeats}</span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, studentSeats * 20)}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-12 bg-red-50 p-6 rounded-3xl border border-red-100">
              <div className="flex items-start justify-between mb-4">
                <div className="text-xs font-black text-red-600 uppercase tracking-widest">{t('teacher.action_needed')}</div>
                <ArrowUpRight size={18} className="text-red-400" />
              </div>
              <p className="text-sm font-bold text-red-900 leading-snug font-noto">
                {taskCount > 0 ? t('teacher.homework_reminder') : t('course_homework.no_tasks_download')}
              </p>
              <button className="mt-4 text-xs font-black text-red-600 hover:underline">
                {t('teacher.remind_all')}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('teacher.recent_activity')}</h3>
            <div className="space-y-5">
              {courses.slice(0, 3).map((course, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-bold">{course.title}</span> <span className="font-medium text-gray-500">{course.status}</span>
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(course.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {courses.length === 0 && <div className="text-sm text-gray-400 font-bold">{t('course.loading')}</div>}
            </div>
            <button className="w-full mt-6 py-3 border border-gray-100 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-widest">
              {t('teacher.view_audit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardView;
