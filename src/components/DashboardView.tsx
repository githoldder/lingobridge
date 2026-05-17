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

interface DashboardViewProps {
  onNavigate?: (target: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const leaderboard = [
    { rank: 2, name: t('leaderboard.li_min'), points: '2,940', avatar: 'Li Min' },
    { rank: 1, name: user?.displayName || t('leaderboard.you'), points: user ? '3,120' : '—', avatar: user?.displayName || t('leaderboard.you'), isUser: true },
    { rank: 3, name: t('leaderboard.zhang_wei'), points: '2,810', avatar: 'Zhang Wei' },
  ];

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
                <span className="text-xs text-gray-500">{t('stats.days')}</span>
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
                <span className="text-xs text-gray-500">{t('stats.pts')}</span>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{t('dashboard.task.prep_family')}</h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2">{t('dashboard.task.prep_desc')}</p>
            <button className="w-full bg-[#0056D2] text-white py-2.5 rounded-lg font-semibold text-sm group-hover:bg-blue-700 transition-colors">
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
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{t('dashboard.task.live_lesson')}</h3>
            <div className="flex items-center gap-2 mb-6">
              <Clock size={14} className="text-orange-500" />
              <p className="text-sm text-orange-600 font-medium">{t('stats.starting_in')} 15 {t('stats.minutes')}</p>
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
              <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">+15 {t('stats.pts')}</span>
            </div>
            <p className="text-xs font-semibold text-green-600 mb-1">{t('dashboard.task.homework')}</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{t('dashboard.task.review_ch2')}</h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2">{t('dashboard.task.review_desc')}</p>
            <button className="w-full bg-[#0056D2] text-white py-2.5 rounded-lg font-semibold text-sm group-hover:bg-blue-700 transition-colors">
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
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <Calendar size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.my_schedule')}</span>
            </button>
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <BarChart size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.week_stats')}</span>
            </button>
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <BookOpen size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.char_lab')}</span>
            </button>
            <button className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[#0056D2] hover:bg-blue-50/10 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                <TrendingUp size={22} />
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center">{t('dashboard.live_events')}</span>
            </button>
          </div>
        </div>

        {/* Weekly Ranking */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.ranking')}</h2>
            <button className="text-[#0056D2] text-xs font-semibold hover:underline">{t('dashboard.leaderboard')}</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-end gap-2 md:gap-8 min-h-[140px] mb-8">
              {leaderboard.map((entry) => {
                const isFirst = entry.rank === 1;
                const borderClass = isFirst
                  ? 'border-4 border-yellow-400 shadow-lg'
                  : entry.rank === 2
                    ? 'border-2 border-gray-100'
                    : 'border-2 border-orange-200';
                const sizeClass = isFirst ? 'w-20 h-20' : entry.rank === 2 ? 'w-14 h-14' : 'w-12 h-12';
                const badgeBg = isFirst ? 'bg-yellow-400 text-white' : entry.rank === 2 ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-700';
                const badgeSize = isFirst ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-[10px]';
                const nameSize = isFirst ? 'text-base font-bold' : 'text-sm font-semibold';
                const pointsColor = isFirst ? 'text-[#0056D2]' : 'text-gray-400';
                const pointsSize = isFirst ? 'text-xs' : 'text-[10px]';
                const mbClass = isFirst ? 'mb-4' : '';

                return (
                  <div key={entry.rank} className={`flex flex-col items-center gap-3 flex-1 ${mbClass}`}>
                    <div className="relative">
                      {isFirst && (
                        <Star size={32} className="text-yellow-400 fill-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 drop-shadow-sm" />
                      )}
                      {entry.isUser && user ? (
                        <img
                          src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(entry.avatar)}&backgroundColor=0056D2&textColor=ffffff`}
                          className={`${sizeClass} rounded-full ${borderClass} object-cover`}
                          alt={`R${entry.rank}`}
                        />
                      ) : (
                        <div className={`${sizeClass} rounded-full ${borderClass} bg-gray-100 flex items-center justify-center`}>
                          <UserIcon size={isFirst ? 32 : entry.rank === 2 ? 22 : 18} className="text-gray-400" />
                        </div>
                      )}
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${badgeSize} rounded-full ${badgeBg} flex items-center justify-center font-bold border-2 border-white shadow-sm`}>
                        {entry.rank}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`${nameSize} text-gray-900`}>{entry.name}</p>
                      <p className={`${pointsSize} font-bold ${pointsColor} uppercase`}>{entry.points} pt</p>
                    </div>
                  </div>
                );
              })}
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
