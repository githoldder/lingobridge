import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Target,
  Users,
  BookOpen,
  Download,
  Eye,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { coursesApi, courseMembersApi, homeworkApi, teacherStudentsApi, type Course } from '../services/apiClient.ts';
import { StudentProgressModal } from './TeacherCourseDetailView.tsx';
import { AnimatePresence } from 'motion/react';

interface CourseReport {
  course: Course;
  students: number;
  tasks: number;
}

interface StudentReportRow {
  id: string;
  username: string;
  displayName: string;
  email: string;
  courseCount: number;
}

const TeacherReportsView = () => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<CourseReport[]>([]);
  const [students, setStudents] = useState<StudentReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<{ studentId: string; displayName: string } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [courses, roster] = await Promise.all([
          coursesApi.list().catch(() => []),
          teacherStudentsApi.search('').catch(() => []),
        ]);
        const reports = await Promise.all(courses.map(async (course) => {
          const [members, tasks] = await Promise.all([
            courseMembersApi.list(course.id).catch(() => []),
            homeworkApi.tasks(course.id, { includeAll: true }).catch(() => []),
          ]);
          return { course, students: members.length, tasks: tasks.length };
        }));
        
        const courseMembers = await Promise.all(
          courses.map((course) => courseMembersApi.list(course.id).catch(() => []))
        );
        const countByStudent = new Map<string, number>();
        courseMembers.flat().forEach((member) => {
          countByStudent.set(member.userId, (countByStudent.get(member.userId) || 0) + 1);
        });

        if (active) {
          setRows(reports);
          setStudents(roster.map((student) => ({
            id: student.id,
            username: student.username,
            displayName: student.displayName,
            email: student.email || student.username,
            courseCount: countByStudent.get(student.id) || 0,
          })));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    const uniqueStudents = new Set<string>();
    rows.forEach((row) => {
      for (let i = 0; i < row.students; i += 1) uniqueStudents.add(`${row.course.id}-${i}`);
    });
    return {
      courses: rows.length,
      studentSeats: rows.reduce((sum, row) => sum + row.students, 0),
      tasks: rows.reduce((sum, row) => sum + row.tasks, 0),
    };
  }, [rows]);

  const chartData = rows.map((row) => ({
    name: row.course.title.length > 12 ? `${row.course.title.slice(0, 12)}...` : row.course.title,
    students: row.students,
    tasks: row.tasks,
  }));

  return (
    <div id="teacher-reports" className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('reports.title')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('reports.subtitle')}</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2 w-fit">
          <Download size={18} />
          {t('reports.export')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Metric icon={<BookOpen size={28} />} value={totals.courses} label={t('course.my_courses')} />
        <Metric icon={<Users size={28} />} value={totals.studentSeats} label={t('students.total_students')} />
        <Metric icon={<Target size={28} />} value={totals.tasks} label={t('course_homework.tasks_parsed')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[360px] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={20} className="text-[#0056D2]" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('reports.efficacy_title')}</h3>
          </div>
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-bold">{t('course.loading')}</div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold">{t('course.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#8a8f98' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8a8f98' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="students" fill="#0056D2" radius={[6, 6, 0, 0]} />
                <Bar dataKey="tasks" fill="#12B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">学情报告快捷检查</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">一键检查您所有学生的历史作业得分、单词掌握以及口语录音回放，帮助老师精确分析进步轨迹。</p>
          <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2">
            {students.length === 0 ? (
              <div className="text-center py-10 text-gray-300 font-bold text-sm">暂无学生数据</div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="flex justify-between items-center p-2 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                      {student.displayName.slice(0, 1)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-800 truncate">{student.displayName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{student.courseCount} 门课程</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudentForProgress({ studentId: student.id, displayName: student.displayName })}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0056D2] text-white rounded-lg hover:bg-blue-700 font-bold text-[10px] transition-colors"
                  >
                    <Eye size={10} />
                    查学情
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">{t('nav.courses')}分析</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <th className="px-6 py-4">{t('reports.table_module')}</th>
              <th className="px-6 py-4 text-center">{t('students.total_students')}</th>
              <th className="px-6 py-4 text-center">{t('course_homework.tasks_parsed')}</th>
              <th className="px-6 py-4 text-right">{t('course_info.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.course.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5 font-bold text-gray-800 text-sm">{row.course.title}</td>
                <td className="px-6 py-5 text-center text-sm font-bold text-[#0056D2]">{row.students}</td>
                <td className="px-6 py-5 text-center text-sm font-bold text-gray-600">{row.tasks}</td>
                <td className="px-6 py-5 text-right text-xs font-bold text-gray-500">{row.course.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedStudentForProgress && (
          <StudentProgressModal
            studentId={selectedStudentForProgress.studentId}
            displayName={selectedStudentForProgress.displayName}
            onClose={() => setSelectedStudentForProgress(null)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl text-[#0056D2]">{icon}</div>
        <div>
          <div className="text-3xl font-black text-gray-900">{value}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default TeacherReportsView;
