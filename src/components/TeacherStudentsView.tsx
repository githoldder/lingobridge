import React from 'react';
import { 
  Users, 
  Search, 
  MessageSquare, 
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const TeacherStudentsView = () => {
  const { t } = useLanguage();

  const students = [
    { id: 1, name: 'Anna Zhang', level: 'HSK 3', progress: 85, attendance: '92%', lastActive: `2 ${t('time.hours')} ${t('time.ago')}`, status: t('students.on_track'), image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop" },
    { id: 2, name: 'Ivan Petrov', level: 'HSK 3', progress: 42, attendance: '75%', lastActive: `1 ${t('time.days')} ${t('time.ago')}`, status: t('students.at_risk'), image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop" },
    { id: 3, name: 'Maria Koslova', level: 'HSK 3', progress: 98, attendance: '100%', lastActive: t('time.now'), status: t('students.excellence'), image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop" },
    { id: 4, name: 'Dmitry Orlov', level: 'HSK 2', progress: 65, attendance: '88%', lastActive: `5 ${t('time.hours')} ${t('time.ago')}`, status: t('students.on_track'), image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop" },
  ];

  return (
    <div id="teacher-students" className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('students.title')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('students.subtitle')}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={t('students.search_placeholder')} 
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
              <th className="px-8 py-5">{t('students.table_student')}</th>
              <th className="px-8 py-5">{t('students.table_engagement')}</th>
              <th className="px-8 py-5">{t('students.table_attendance')}</th>
              <th className="px-8 py-5">{t('students.table_status')}</th>
              <th className="px-8 py-5">{t('students.table_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <img src={student.image} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt={student.name} referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-400">{student.level} • {t('students.active_label')} {student.lastActive}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3 w-48">
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0056D2] h-full rounded-full" style={{ width: `${student.progress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{student.progress}%</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-bold text-gray-600">{student.attendance}</td>
                <td className="px-8 py-6">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit ${
                    student.status === t('students.excellence') ? 'bg-green-100 text-green-700' :
                    student.status === t('students.at_risk') ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-[#0056D2]'
                  }`}>
                    {student.status === t('students.excellence') && <CheckCircle size={10} />}
                    {student.status === t('students.at_risk') && <AlertCircle size={10} />}
                    {student.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-[#0056D2] hover:bg-blue-50 rounded-lg transition-all">
                      <MessageSquare size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056D2]">
            <Users size={28} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">124</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('students.total_students')}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <CheckCircle size={28} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">92%</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('students.avg_attendance')}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">8</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('students.students_at_risk')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentsView;
