import React from 'react';
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

interface TeacherDashboardViewProps {
  onNavigate?: (target: string) => void;
}

const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const stats = [
    { label: t('nav.students'), value: '124', icon: Users, color: 'bg-blue-50 text-blue-600', trend: '+12%' },
    { label: t('nav.courses'), value: '12', icon: BookOpen, color: 'bg-red-50 text-red-600', trend: '+2' },
    { label: t('classroom.recording'), value: '450', icon: Clock, color: 'bg-green-50 text-green-600', trend: '+85h' },
    { label: t('nav.reports'), value: '78%', icon: TrendingUp, color: 'bg-purple-50 text-purple-600', trend: '+5%' },
  ];

  const upcomingClasses = [
    { time: '10:00 AM', title: 'Beginner HSK 1 - Unit 4', level: 'Level 1', students: 12 },
    { time: '02:30 PM', title: 'Business Chinese Prep', level: 'Level 4', students: 8 },
    { time: '04:00 PM', title: 'Interactive Workshop', level: 'Mixed', students: 25 },
  ];

  return (
    <div id="teacher-dashboard" className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{t('dashboard.greeting_teacher')}</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">{t('dashboard.overview')}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            {t('dashboard.schedule')}
          </button>
          <button 
            onClick={() => onNavigate?.('teacher-classroom')}
            className="flex-1 md:flex-none px-6 py-2 bg-[#0056D2] text-white rounded-xl text-sm font-bold hover:shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
          >
            <Play size={18} fill="currentColor" />
            <span className="whitespace-nowrap">{t('nav.classroom')}</span>
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
              <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                {stat.trend}
              </span>
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
            {upcomingClasses.map((item, i) => (
              <div key={i} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-[#0056D2] transition-colors cursor-pointer">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="bg-gray-50 px-3 py-2 md:px-4 md:py-3 rounded-2xl text-center border border-gray-100 group-hover:bg-blue-50 transition-colors min-w-[60px]">
                    <div className="text-[10px] md:text-xs font-black text-[#0056D2]">{item.time.split(' ')[1]}</div>
                    <div className="text-base md:text-lg font-black text-gray-900 leading-none">{item.time.split(' ')[0]}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm md:text-base">{item.title}</h4>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium">{item.level} • {item.students} {t('classroom.students')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-stretch sm:self-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">S{n}</div>
                    ))}
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-[#0056D2]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Analytics & Notifications */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 font-noto">Weekly Engagement</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  <span>Quiz Completion</span>
                  <span className="text-gray-900">92%</span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div className="bg-blue-500 h-full w-[92%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  <span>Student Satisfaction</span>
                  <span className="text-gray-900">4.9/5.0</span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div className="bg-green-500 h-full w-[98%]" />
                </div>
              </div>
            </div>

            <div className="mt-12 bg-red-50 p-6 rounded-3xl border border-red-100">
              <div className="flex items-start justify-between mb-4">
                <div className="text-xs font-black text-red-600 uppercase tracking-widest">Action Needed</div>
                <ArrowUpRight size={18} className="text-red-400" />
              </div>
              <p className="text-sm font-bold text-red-900 leading-snug font-noto">
                8 Students have not completed their Unit 3 Homework.
              </p>
              <button className="mt-4 text-xs font-black text-red-600 hover:underline">
                REMIND ALL STUDENTS
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-5">
              {[
                { type: 'submission', user: 'Anna Zhang', task: 'HSK 3 Quiz', time: '10 min ago' },
                { type: 'enrollment', user: 'Mark Doe', task: 'Business Chinese', time: '1 hour ago' },
                { type: 'message', user: 'Ivan Petrov', task: 'HSK 2 Question', time: '3 hours ago' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'submission' ? 'bg-green-400' : 
                    activity.type === 'enrollment' ? 'bg-blue-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-bold">{activity.user}</span> {activity.type === 'submission' ? 'submitted' : activity.type === 'enrollment' ? 'enrolled in' : 'messaged about'} <span className="font-medium text-gray-500">{activity.task}</span>
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border border-gray-100 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-widest">
              View Audit Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardView;
