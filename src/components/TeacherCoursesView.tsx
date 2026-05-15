import React, { useEffect, useState } from 'react';
import {
  Plus,
  Users,
  Clock,
  CheckCircle,
  BarChart2,
  BookOpen,
  UploadCloud,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { coursesApi, type Course } from '../services/apiClient.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TeacherCoursesViewProps {
  onNavigate?: (target: string) => void;
}

const TeacherCoursesView: React.FC<TeacherCoursesViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('course-1');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await coursesApi.list();
      setCourses(data);
      setSelectedCourseId(data[0]?.id || 'course-1');
    } catch (error: any) {
      setMessage(error.message || t('course.load_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const createCourse = async () => {
    setMessage('');
    try {
      const course = await coursesApi.create(title || t('course.untitled'));
      setCourses((prev) => [course, ...prev]);
      setSelectedCourseId(course.id);
      setMessage(t('course.created'));
    } catch (error: any) {
      setMessage(error.message || t('course.create_failed'));
    }
  };

  const uploadCourseware = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    setMessage('');
    try {
      const result = await coursesApi.uploadCourseware(selectedCourseId, file);
      const pages = result.pages?.length || 0;
      const tasks = (result as any).tasks?.length || 0;
      setMessage(t('course.upload_result')
        .replace('{filename}', file.name)
        .replace('{pages}', String(pages))
        .replace('{exercises}', String(tasks)));
      await loadCourses();
    } catch (error: any) {
      setMessage(error.message || t('course.upload_failed'));
    } finally {
      setIsUploading(false);
    }
  };

  const uploadExcel = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    setMessage('');
    try {
      const result = await coursesApi.uploadCourseware(selectedCourseId, file);
      const tasks = (result as any).tasks?.length || 0;
      const vocab = (result as any).vocabulary?.length || 0;
      const warnings = (result as any).warnings;
      setMessage(t('course.excel_result')
        .replace('{filename}', file.name)
        .replace('{tasks}', String(tasks))
        .replace('{vocab}', String(vocab)));
      if (warnings) {
        setMessage(prev => prev + ' ' + t('course.excel_warnings') + ': ' + warnings.join('; '));
      }
      await loadCourses();
    } catch (error: any) {
      setMessage(error.message || t('course.upload_failed'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="teacher-courses" className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between gap-6 lg:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('course.my_courses')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('course.manage')}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-[220px] rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold outline-none focus:border-[#0056D2]"
            placeholder={t('course.title_placeholder')}
          />
          <button
            onClick={createCourse}
            className="bg-[#0056D2] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            {t('course.create')}
          </button>
          <label className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {t('course.upload_courseware')}
            <input
              type="file"
              accept=".pptx,.pdf"
              className="hidden"
              onChange={(event) => uploadCourseware(event.target.files?.[0])}
            />
          </label>
          <label className="bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            {t('course.upload_excel')}
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(event) => uploadExcel(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-[#0056D2] rounded-2xl px-5 py-4 text-sm font-bold flex items-center gap-3">
        <FileSpreadsheet size={18} />
        {message || t('course.upload_hint')}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-400 font-bold">{t('course.loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedCourseId(course.id)}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col group cursor-pointer ${
                selectedCourseId === course.id ? 'border-[#0056D2] ring-4 ring-blue-50' : 'border-gray-100'
              }`}
            >
              <div className="h-40 relative bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                <BookOpen size={48} className="text-[#0056D2]" />
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm bg-green-100 text-green-700">
                  <CheckCircle size={10} />
                  {course.status}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 leading-snug mb-1 group-hover:text-[#0056D2] transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium mb-4 line-clamp-2">{course.description || t('course.no_description')}</p>

                <div className="grid grid-cols-3 gap-2 text-gray-400 text-xs font-semibold mb-6">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={14} />
                    {course.pagesCount || 0}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    {course.recordingsCount || 0}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {new Date(course.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-100">
                    {course.exercisesCount || 0} {t('course.exercises')}
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      localStorage.setItem('lingobridge_courseId', course.id);
                      onNavigate?.('teacher-classroom');
                    }}
                    className="flex-1 py-2 bg-blue-50 text-[#0056D2] rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    {t('course.enter')}
                  </button>
                </div>

                <button className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-400 hover:text-[#0056D2] transition-colors">
                  <BarChart2 size={14} />
                  {t('course.reports')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherCoursesView;
