import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Flame,
  ArrowRight,
  BookOpen,
  Video,
  ClipboardList,
  Clock,
  Calendar,
  BarChart,
  TrendingUp,
  Brain,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { learningRecordsApi } from '../services/apiClient.ts';

interface DashboardViewProps {
  onNavigate?: (target: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    streak: 7,
    points: 1200,
    mastery: 72,
    tone3: 15,
    tone4: 8,
    risk: 'low'
  });

  useEffect(() => {
    if (!user) return;
    learningRecordsApi.list(localStorage.getItem('lingobridge_courseId') || 'course-default')
      .then((records) => {
        if (!records || records.length === 0) return;
        const totalScore = records.reduce((sum, r) => sum + r.score, 0);
        const avgMastery = Math.round(totalScore / records.length);
        const t3 = records.filter(r => r.taskId.includes('tone3') || r.taskId.includes('Tone3')).reduce((sum, r) => sum + r.score, 0);
        const t4 = records.filter(r => r.taskId.includes('tone4') || r.taskId.includes('Tone4')).reduce((sum, r) => sum + r.score, 0);

        setStats(prev => ({
          ...prev,
          points: records.length * 150,
          mastery: avgMastery > 0 ? avgMastery : 72,
          tone3: t3 > 0 ? Math.round(t3 / records.length) : 12,
          tone4: t4 > 0 ? Math.round(t4 / records.length) : 6,
          risk: avgMastery > 60 ? 'low' : 'high'
        }));
      })
      .catch(() => {});
  }, [user]);

  return (
    <div id="dashboard-view" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 顶部热力图最高区：欢迎与AI学情追踪 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 欢迎卡片 */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-blue-50/20 rounded-[2.5rem] border border-gray-100 p-8 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-4">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {t('dashboard.greeting', { name: user?.displayName || '学生' })} 👋
            </h1>
            <p className="text-sm text-gray-500 font-medium max-w-md leading-relaxed">
              {t('dashboard.quote') || '学习是一种习惯... 不断挑战自我，逐字攻克中文。'}
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={() => onNavigate?.('homework')}
                className="bg-[#0056D2] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/10"
              >
                第三课：自我介绍
              </button>
              <button
                onClick={() => onNavigate?.('schedule')}
                className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
              >
                今日日程
              </button>
            </div>
          </div>
          <div className="absolute right-6 bottom-6 opacity-5 pointer-events-none">
            <Brain size={180} />
          </div>
        </div>

        {/* AI学情分析卡片 (原型图最高点击部分) */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0056D2]" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">快速访问 · AI</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="text-2xl font-extrabold text-[#0056D2]">{stats.mastery}%</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">掌握度</div>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="text-xs font-bold text-gray-700">Tone 3: {stats.tone3}%</div>
                <div className="text-xs font-bold text-gray-700 mt-1">Tone 4: {stats.tone4}%</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">声调明细</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stats.risk === 'low' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs font-bold text-gray-400">风险等级: {stats.risk === 'low' ? '低风险' : '高风险'}</span>
            </div>
            <button
              onClick={() => onNavigate?.('knowledge-graph')}
              className="text-[#0056D2] text-xs font-extrabold flex items-center gap-1 hover:underline"
            >
              打开知识图谱 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 今日任务 (次高点击区) */}
      <section id="today-tasks" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">今日推荐练习</h2>
          <button
            onClick={() => onNavigate?.('homework')}
            className="text-[#0056D2] text-sm font-semibold flex items-center gap-1 hover:underline"
          >
            查看全部 <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 任务 1 */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between group hover:border-[#0056D2] hover:shadow-xl transition-all cursor-pointer">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 text-[#0056D2] rounded-2xl w-fit">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#0056D2] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">预习</span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">第三课 “自我介绍”</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">预习新课生词拼音，准备明天的课堂连线。</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('homework')}
              className="w-full mt-6 bg-gray-50 text-[#0056D2] group-hover:bg-[#0056D2] group-hover:text-white py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider"
            >
              开始练习
            </button>
          </div>

          {/* 任务 2 */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between group hover:border-orange-300 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 py-1.5 px-8 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rotate-45 translate-x-6 translate-y-3 shadow-sm">
              直播
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl w-fit">
                <Video size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-wider">即将开始</span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">在线互动课堂</h3>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-600 font-semibold">
                  <Clock size={12} />
                  <span>还有 15 分钟开始</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('student-classroom')}
              className="w-full mt-6 bg-[#0056D2] text-white py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider"
            >
              进入教室
            </button>
          </div>

          {/* 任务 3 */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between group hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer">
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                <ClipboardList size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">作业</span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">第二章声调测试</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">完成第二章听力与声母朗读纠音作业。</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('homework')}
              className="w-full mt-6 bg-gray-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white py-3 rounded-2xl font-bold text-xs transition-all uppercase tracking-wider"
            >
              提交作业
            </button>
          </div>
        </div>
      </section>

      {/* 底部区：快速导航 与 积分统计 (低频区) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 导航面板 */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">便捷入口</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate?.('schedule')}
              className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#0056D2] transition-all flex flex-col items-center gap-3 group text-center"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-all">
                <Calendar size={18} />
              </div>
              <span className="text-xs font-bold text-gray-600">查看日程</span>
            </button>

            <button
              onClick={() => onNavigate?.('student-ranking')}
              className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#0056D2] transition-all flex flex-col items-center gap-3 group text-center"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-all">
                <BarChart size={18} />
              </div>
              <span className="text-xs font-bold text-gray-600">学习分析</span>
            </button>

            <button
              onClick={() => onNavigate?.('vocabulary')}
              className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#0056D2] transition-all flex flex-col items-center gap-3 group text-center"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-all">
                <BookOpen size={18} />
              </div>
              <span className="text-xs font-bold text-gray-600">探索词汇</span>
            </button>

            <button
              onClick={() => onNavigate?.('knowledge-graph')}
              className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#0056D2] transition-all flex flex-col items-center gap-3 group text-center"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition-all">
                <TrendingUp size={18} />
              </div>
              <span className="text-xs font-bold text-gray-600">知识图谱</span>
            </button>
          </div>
        </div>

        {/* 积分与连续天数 */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">我的成就</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <Flame size={24} className="text-orange-500" />
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.streak}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">连续天数</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <Trophy size={24} className="text-[#0056D2]" />
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.points}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">总积分</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
