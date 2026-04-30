import React from 'react';
import { 
  Plus, 
  MoreVertical, 
  Users, 
  Clock, 
  CheckCircle, 
  BarChart2,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';

const TeacherCoursesView = () => {
  const courses = [
    {
      id: 1,
      title: "Basic Chinese Language Course (Part 1)",
      semester: "Spring Semester 2024",
      students: 32,
      lastUpdate: "2024-05-20",
      status: "Published",
      image: "https://images.unsplash.com/photo-1508670510197-4071ba5d3514?w=800&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Advanced Chinese (HSK 4 Prep)",
      semester: "Fall Semester 2023",
      students: 24,
      lastUpdate: "2024-05-18",
      status: "Published",
      image: "https://images.unsplash.com/photo-1540655037529-dec987208707?w=800&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Business Chinese for Professionals",
      semester: "Summer 2024 (Planned)",
      students: 0,
      lastUpdate: "2024-05-21",
      status: "Draft",
      image: null
    }
  ];

  return (
    <div id="teacher-courses" className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Courses</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your teaching materials and virtual classrooms.</p>
        </div>
        <button className="bg-[#0056D2] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2 active:scale-95">
          <Plus size={20} />
          Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => (
          <motion.div 
            key={course.id}
            whileHover={{ y: -5 }}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group ${course.status === 'Draft' ? 'opacity-75' : ''}`}
          >
            <div className="h-40 relative bg-gray-100">
              {course.image ? (
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <BookOpen size={48} />
                </div>
              )}
              <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                course.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {course.status === 'Published' && <CheckCircle size={10} />}
                {course.status}
              </div>
              <button className="absolute top-3 right-3 p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-white backdrop-blur-sm transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-800 leading-snug mb-1 group-hover:text-[#0056D2] transition-colors">
                {course.title}
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-4">{course.semester}</p>
              
              <div className="flex items-center gap-4 text-gray-400 text-xs font-semibold mb-6">
                <div className="flex items-center gap-1.5">
                  <Users size={14} />
                  {course.students}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {course.lastUpdate}
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors border border-gray-100">
                  Edit
                </button>
                <button className="flex-1 py-2 bg-blue-50 text-[#0056D2] rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                  Enter Class
                </button>
              </div>
              
              <button className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-400 hover:text-[#0056D2] transition-colors">
                <BarChart2 size={14} />
                Learning Report
              </button>
            </div>
          </motion.div>
        ))}

        {/* Create Card */}
        <button className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center group hover:border-[#0056D2] hover:bg-blue-50 transition-all">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#0056D2] mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <h4 className="font-bold text-gray-800 mb-1">Create Course</h4>
          <p className="text-xs text-gray-400 font-medium">Add new teaching materials</p>
        </button>
      </div>
    </div>
  );
};

export default TeacherCoursesView;
