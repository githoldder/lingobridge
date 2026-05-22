import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  MoreVertical, 
  Plus, 
  BarChart,
  BookOpen,
  X,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchLessonNodes, type LessonNode } from '../services/entryResolver.ts';
import { coursesApi, type Course } from '../services/apiClient.ts';

interface CoursesViewProps {
  onNavigate?: (target: string, ctx?: { lessonNodeId?: string; courseId?: string }) => void;
}

const CourseCard = ({ title, students, date, status, courseId, onSelectLesson }: any) => {
  const { t } = useLanguage();
  const [showLessons, setShowLessons] = useState(false);
  const [lessonNodes, setLessonNodes] = useState<LessonNode[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  const handleEnter = async () => {
    if (!courseId) return;
    setLoadingLessons(true);
    setShowLessons(true);
    try {
      const nodes = await fetchLessonNodes(courseId);
      setLessonNodes(nodes);
    } catch {
      setLessonNodes([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSelectLesson = (node: LessonNode) => {
    onSelectLesson?.(node);
    setShowLessons(false);
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 relative group-hover:opacity-90 transition-opacity flex items-center justify-center">
        <BookOpen size={48} className="text-white/30" />
        <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 size={12} />
          {status === 'published' ? t('course.published') : t('course.draft')}
        </div>
        <button className="absolute top-4 right-4 p-1.5 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors backdrop-blur-sm">
          <MoreVertical size={18} />
        </button>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight line-clamp-2 min-h-[2.5rem]">{title}</h3>
        <p className="text-xs text-gray-500 mb-6">{date ? new Date(date).toLocaleDateString() : ''}</p>
        
        <div className="flex items-center gap-6 text-gray-500 text-xs font-semibold mb-6">
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-gray-400" />
            {students ?? 0}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-gray-400" />
            {date ? new Date(date).toLocaleDateString() : '-'}
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button 
            onClick={handleEnter}
            className="flex-1 bg-blue-50 text-[#0056D2] py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            {t('course.enter')}
          </button>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {showLessons && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setShowLessons(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLessons(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('courses.select_lesson')}</p>
            </div>

            {loadingLessons ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-[#0056D2] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('homework.loading')}</p>
              </div>
            ) : lessonNodes.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">{t('courses.no_lessons')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {lessonNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelectLesson(node)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#0056D2] hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0056D2] flex items-center justify-center font-bold text-sm">
                        {node.unit}-{node.lesson}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{node.title}</p>
                        <p className="text-xs text-gray-400">{t('homework.unit')} {node.unit} · {t('homework.lesson')} {node.lesson}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-[#0056D2] transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

const CoursesView: React.FC<CoursesViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.list()
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectLesson = (node: any) => {
    onNavigate?.('homework', { lessonNodeId: node.id, courseId: node.courseId });
  };

  return (
    <div id="courses-view" className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('course.my_courses')}</h1>
          <p className="text-sm text-gray-600">{t('course.manage')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-[#0056D2] rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 font-bold">{t('courses.no_courses')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} onSelectLesson={handleSelectLesson} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesView;
