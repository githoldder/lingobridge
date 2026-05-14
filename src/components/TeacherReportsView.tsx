import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award,
  Filter,
  Download,
  Search,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const data = [
  { name: 'Mon', active: 45, score: 72 },
  { name: 'Tue', active: 52, score: 75 },
  { name: 'Wed', active: 48, score: 68 },
  { name: 'Thu', active: 61, score: 82 },
  { name: 'Fri', active: 55, score: 78 },
  { name: 'Sat', active: 42, score: 85 },
  { name: 'Sun', active: 38, score: 88 },
];

const TeacherReportsView = () => {
  const { t } = useLanguage();

  return (
    <div id="teacher-reports" className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('reports.title')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Filter size={20} className="text-gray-400" />
          </button>
          <button className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download size={18} />
            {t('reports.export')}
          </button>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-4 rounded-2xl text-[#0056D2]">
              <TrendingUp size={28} />
            </div>
            <div className="flex items-center gap-1 text-green-500 font-bold text-sm">
              <ArrowUp size={14} /> 12%
            </div>
          </div>
          <div className="text-4xl font-black text-gray-900">88.4%</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('reports.engagement_rate')}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-50 p-4 rounded-2xl text-red-600">
              <Target size={28} />
            </div>
            <div className="flex items-center gap-1 text-red-500 font-bold text-sm">
              <ArrowDown size={14} /> 2.1%
            </div>
          </div>
          <div className="text-4xl font-black text-gray-900">HSK 3</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('reports.proficiency_level')}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
              <Award size={28} />
            </div>
            <div className="flex items-center gap-1 text-green-500 font-bold text-sm">
              <ArrowUp size={14} /> 4%
            </div>
          </div>
          <div className="text-4xl font-black text-gray-900">421</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('reports.certificates')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('reports.active_time')}</h3>
            <select className="bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-500 focus:ring-0">
              <option>{t('reports.last_7_days')}</option>
              <option>{t('reports.last_30_days')}</option>
            </select>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 500, fill: '#A0A0A0' }} 
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                <Bar dataKey="active" fill="#0056D2" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('reports.accuracy')}</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('reports.daily_avg')}</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 500, fill: '#A0A0A0' }} 
                  dy={10}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#0056D2" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#0056D2', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8, fill: '#0056D2', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Course Specific Stats */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{t('reports.efficacy_title')}</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={t('reports.filter_courses')} 
              className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-1 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">{t('reports.table_module')}</th>
                <th className="px-8 py-5 text-center">{t('reports.table_score')}</th>
                <th className="px-8 py-5 text-center">{t('reports.table_completion')}</th>
                <th className="px-8 py-5 text-right">{t('reports.table_trend')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: 'HSK 1: Fundamental Phonetics', score: '94%', completion: '98%', status: 'up' },
                { name: 'HSK 2: Daily Life Situations', score: '82%', completion: '85%', status: 'up' },
                { name: 'Business Chinese: Negotiation 101', score: '76%', completion: '62%', status: 'down' },
                { name: 'Cultural Immersion: Calligraphy', score: '89%', completion: '91%', status: 'up' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-8 py-6 font-bold text-gray-800 text-sm">{item.name}</td>
                  <td className="px-8 py-6 text-center text-sm font-bold text-[#0056D2]">{item.score}</td>
                  <td className="px-8 py-6 text-center text-sm font-bold text-gray-600">{item.completion}</td>
                  <td className={`px-8 py-6 text-right font-bold text-xs ${item.status === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.status === 'up' ? `↗ ${t('reports.stable')}` : `↘ ${t('reports.at_risk')}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherReportsView;
