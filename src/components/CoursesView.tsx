import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  MoreVertical, 
  Plus, 
  Image as ImageIcon,
  BarChart,
  Layout
} from 'lucide-react';

const CourseCard = ({ title, semester, students, date, status, image }: any) => {
  const { t } = useLanguage();
  return (
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
        <button className="flex-1 bg-blue-50 text-[#0056D2] py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
          {t('course.enter')}
        </button>
      </div>
      
      <button className="w-full text-[#0056D2] py-2 text-xs font-bold hover:bg-blue-50/50 rounded-lg flex items-center justify-center gap-2 transition-colors">
        <BarChart size={14} />
        {t('course.reports')}
      </button>
    </div>
  </div>
  );
};

const CoursesView = () => {
  const { t } = useLanguage();
  const courses = [
    {
      title: t('course.basic'),
      semester: t('course.spring'),
      students: 32,
      date: "2024-05-20",
      status: "Published",
      image: "https://images.unsplash.com/photo-1508670510197-4071ba5d3514?w=800&auto=format&fit=crop"
    },
    {
      title: t('course.advanced'),
      semester: t('course.autumn'),
      students: 24,
      date: "2024-05-18",
      status: "Published",
      image: "https://images.unsplash.com/photo-1540655037529-dec987208707?w=800&auto=format&fit=crop"
    },
    {
      title: t('course.business'),
      semester: t('course.summer'),
      students: 0,
      date: "2024-05-21",
      status: "Draft",
      image: "https://images.unsplash.com/photo-1523050853023-8c2d27543630?w=800&auto=format&fit=crop"
    }
  ];

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
          <CourseCard key={idx} {...course} />
        ))}
        
        {/* Placeholder for creating new */}
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
