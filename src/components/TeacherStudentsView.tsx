import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { coursesApi, courseMembersApi, teacherStudentsApi } from '../services/apiClient.ts';

interface StudentRow {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  courseCount: number;
}

const TeacherStudentsView = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [roster, courses] = await Promise.all([
          teacherStudentsApi.search(query).catch(() => []),
          coursesApi.list().catch(() => []),
        ]);
        const courseMembers = await Promise.all(
          courses.map((course) => courseMembersApi.list(course.id).catch(() => []))
        );
        const countByStudent = new Map<string, number>();
        courseMembers.flat().forEach((member) => {
          countByStudent.set(member.userId, (countByStudent.get(member.userId) || 0) + 1);
        });
        if (!active) return;
        setStudents(roster.map((student) => ({
          id: student.id,
          username: student.username,
          displayName: student.displayName,
          email: student.email || student.username,
          courseCount: countByStudent.get(student.id) || 0,
        })));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [query]);

  const stats = useMemo(() => {
    const assigned = students.filter((student) => student.courseCount > 0).length;
    return {
      total: students.length,
      assigned,
      unassigned: Math.max(0, students.length - assigned),
    };
  }, [students]);

  return (
    <div id="teacher-students" className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('students.title')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('students.subtitle')}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('students.search_placeholder')}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
              <th className="px-6 py-4">{t('students.table_student')}</th>
              <th className="px-6 py-4">{t('course.my_courses')}</th>
              <th className="px-6 py-4">{t('students.table_status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 font-bold">{t('course.loading')}</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 font-bold">{t('course_students.empty')}</td></tr>
            ) : students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0056D2] text-white flex items-center justify-center text-sm font-black">
                      {student.displayName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{student.displayName}</div>
                      <div className="text-xs text-gray-400">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm font-bold text-gray-600">{student.courseCount}</td>
                <td className="px-6 py-5">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                    student.courseCount > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {student.courseCount > 0 ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    {student.courseCount > 0 ? t('students.on_track') : t('live_class.unassigned')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Metric icon={<Users size={26} />} value={stats.total} label={t('students.total_students')} tone="blue" />
        <Metric icon={<CheckCircle size={26} />} value={stats.assigned} label={t('course.my_courses')} tone="green" />
        <Metric icon={<AlertCircle size={26} />} value={stats.unassigned} label={t('live_class.unassigned')} tone="yellow" />
      </div>
    </div>
  );
};

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: 'blue' | 'green' | 'yellow' }) {
  const toneClass = tone === 'green' ? 'bg-green-50 text-green-600' : tone === 'yellow' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-[#0056D2]';
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${toneClass}`}>{icon}</div>
      <div>
        <div className="text-2xl font-black text-gray-900">{value}</div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

export default TeacherStudentsView;
