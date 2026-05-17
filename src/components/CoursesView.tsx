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

interface CoursesViewProps {
  onNavigate?: (target: string, ctx?: { lessonNodeId?: string; courseId?: string }) => void;
}

const CourseCard = ({ title, semester, students, date, status, image, courseId, onSelectLesson }: any) => {
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
      <div className="h-40 relative group-hover:opacity-90 transition-opacity">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 size={12} />
          {status === 'Published' ? t('course.published') : t('course.draft')}
        </div>
        <button className="absolute top-4 right-4 p-1.5 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors backdrop-blur-sm">
          <MoreVertical size={18} />
        </button>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight line-clamp-2 min-h-[2.5rem]">{title}</h3>
        <p className="text-xs text-gray-500 mb-6">{semester}</p>
        
        <div className="flex items-center gap-6 text-gray-500 text-xs font-semibold mb-6">
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-gray-400" />
            {students}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-gray-400" />
            {date}
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
            {t('course.edit')}
          </button>
          <button 
            onClick={handleEnter}
            className="flex-1 bg-blue-50 text-[#0056D2] py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            {t('course.enter')}
          </button>
        </div>
        
        <button className="w-full text-[#0056D2] py-2 text-xs font-bold hover:bg-blue-50/50 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <BarChart size={14} />
          {t('course.reports')}
        </button>
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
  const [courses] = useState([
    {
      id: 'course-1',
      title: t('course.basic'),
      semester: t('course.spring'),
      students: 32,
      date: "2024-05-20",
      status: "Published",
      image: "https://images.unsplash.com/photo-1508670510197-4071ba5d3514?w=800&auto=format&fit=crop"
    },
    {
      id: 'course-2',
      title: t('course.advanced'),
      semester: t('course.autumn'),
      students: 24,
      date: "2024-05-18",
      status: "Published",
      image: "https://images.unsplash.com/photo-1540655037529-dec987208707?w=800&auto=format&fit=crop"
    },
    {
      id: 'course-3',
      title: t('course.business'),
      semester: t('course.summer'),
      students: 0,
      date: "2024-05-21",
      status: "Draft",
      image: "https://images.unsplash.com/photo-1523050853023-8c2d27543630?w=800&auto=format&fit=crop"
    }
  ]);

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
        <button className="bg-[#0056D2] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={18} />
          {t('course.create')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {courses.map((course, idx) => (
          <CourseCard key={idx} {...course} onSelectLesson={handleSelectLesson} />
        ))}
        
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center min-h-[300px] hover:border-[#0056D2] hover:bg-blue-50/10 transition-all cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-[#0056D2]" />
          </div>
          <h3 className="text-lg font-bold text-[#0056D2] mb-1">{t('course.add_new')}</h3>
          <p className="text-xs text-gray-500">{t('course.custom_syllabus')}</p>
        </div>
      </div>
    </div>
  );
};

export default CoursesView;
