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
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface DashboardViewProps {
  onNavigate?: (target: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div id="dashboard-view" className="space-y-8">
      {/* Welcome & Stats Hero */}
      <section id="dashboard-hero" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="hero-welcome" className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative p-8">
          <div className="relative z-10">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t('dashboard.greeting_student')} 👋</h1>
            <p className="text-xs md:text-sm text-gray-600 mb-6 max-w-sm">{t('dashboard.quote')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#0056D2] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                {t('dashboard.continue')}
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
                <span className="text-2xl font-bold text-gray-900">28</span>
                <span className="text-xs text-gray-500">days</span>
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
                <span className="text-2xl font-bold text-gray-900">2,860</span>
                <span className="text-xs text-gray-500">pts</span>
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
              <span className="bg-blue-100 text-[#0056D2] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">+10 pts</span>
            </div>
            <p className="text-xs font-semibold text-[#0056D2] mb-1">Preview Assignment</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">Preparation: Lesson 3 "Family"</h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2">Study new vocabulary and grammar patterns for the upcoming lesson.</p>
            <button className="w-full bg-[#0056D2] text-white py-2.5 rounded-lg font-semibold text-sm group-hover:bg-blue-700 transition-colors">
              Start Assignment
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 py-1 px-8 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rotate-45 translate-x-6 translate-y-3 shadow-sm">
              Live Soon
            </div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Video size={24} />
              </div>
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider mr-6">+20 pts</span>
            </div>
            <p className="text-xs font-semibold text-orange-600 mb-1">Class Reminder</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">14:00 Online Lesson: HSK 3 Grammar</h3>
            <div className="flex items-center gap-2 mb-6">
              <Clock size={14} className="text-orange-500" />
              <p className="text-sm text-orange-600 font-medium">{t('dashboard.starting_in')} 15 {t('dashboard.minutes')}</p>
            </div>
            <button 
              onClick={() => onNavigate?.('student-classroom')}
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
              <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">+15 pts</span>
            </div>
            <p className="text-xs font-semibold text-green-600 mb-1">Homework</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">Review: Chapter 2 Comprehension</h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2">Complete the listening and reading exercises from previous unit.</p>
            <button className="w-full bg-[#0056D2] text-white py-2.5 rounded-lg font-semibold text-sm group-hover:bg-blue-700 transition-colors">
              Submit Task
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Access */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Quick Access</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <Calendar size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">My Schedule</span>
            </button>
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <BarChart size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">Week Stats</span>
            </button>
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <BookOpen size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">Character Lab</span>
            </button>
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <TrendingUp size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">Live Events</span>
            </button>
          </div>
        </div>

        {/* Weekly Ranking */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Weekly Ranking</h2>
            <button className="text-[#0056D2] text-xs font-semibold hover:underline">Full Leaderboard</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-end gap-2 md:gap-8 min-h-[140px] mb-8">
              {/* Rank 2 */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop" 
                    className="w-14 h-14 rounded-full border-2 border-gray-100 object-cover" 
                    alt="R2"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold border-2 border-white">2</div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">Li Min</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">2,940 pt</p>
                </div>
              </div>
              {/* Rank 1 */}
              <div className="flex flex-col items-center gap-3 flex-1 mb-4">
                <div className="relative">
                  <Star size={32} className="text-yellow-400 fill-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 drop-shadow-sm" />
                  <img 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop" 
                    className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover shadow-lg" 
                    alt="R1"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">1</div>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-gray-900">Anna Zhang</p>
                  <p className="text-xs font-bold text-[#0056D2] uppercase">3,120 pt</p>
                </div>
              </div>
              {/* Rank 3 */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop" 
                    className="w-12 h-12 rounded-full border-2 border-orange-200 object-cover" 
                    alt="R3"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-2 -left-1 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold border-2 border-white">3</div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">Zhang Wei</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">2,810 pt</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-1.5">
              <div className="w-6 h-1.5 rounded-full bg-[#0056D2]" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
