import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ScheduleViewProps {
  onNavigate?: (target: string) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSynced(true);
    }, 1500);
  };

  const scheduleItems = [
    {
      id: 1,
      title: 'Basic Chinese (Part 1)',
      time: '10:00 AM - 11:30 AM',
      date: 'Today',
      instructor: 'Teacher Li',
      isLive: true,
      color: 'blue'
    },
    {
      id: 2,
      title: 'HSK 3 Vocabulary Review',
      time: '02:00 PM - 03:00 PM',
      date: 'Today',
      instructor: 'Teacher Wang',
      isLive: false,
      color: 'orange'
    },
    {
      id: 3,
      title: 'Chinese Culture & History',
      time: '10:00 AM - 11:00 AM',
      date: 'Tomorrow',
      instructor: 'Teacher Chen',
      isLive: true,
      color: 'purple'
    }
  ];

  return (
    <div id="schedule-view" className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.schedule_label')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('dashboard.overview')}</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            synced 
              ? 'bg-green-50 text-green-600 border border-green-100' 
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : synced ? 'Synced with Google Calendar' : 'Sync Google Calendar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Weekly Calendar Preview */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">April 2026</h3>
            <div className="flex gap-2">
              <button className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} /></button>
              <button className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(30)].map((_, i) => {
              const day = i + 1;
              const isToday = day === 30;
              return (
                <button 
                  key={i}
                  className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isToday ? 'bg-[#0056D2] text-white shadow-lg' : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="pt-6 border-t border-gray-100">
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Deadlines</h4>
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Vocabulary Quiz</p>
                    <p className="text-[10px] text-gray-500">Today, 23:59</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Detailed Agenda */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Live Sessions</h3>
              <div className="flex bg-white rounded-lg p-1 border border-gray-100">
                <button className="px-4 py-1.5 rounded-md bg-gray-900 text-white text-xs font-bold shadow-md">Agenda</button>
                <button className="px-4 py-1.5 rounded-md text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors">Week</button>
              </div>
           </div>

           <div className="space-y-4">
              {scheduleItems.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-[#0056D2] transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div className={`px-4 py-3 rounded-2xl text-center border transition-colors ${
                      item.isLive ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                      <CalendarIcon size={20} className={item.isLive ? 'text-[#0056D2]' : 'text-gray-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                        {item.isLive && (
                          <span className="flex items-center gap-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            <div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {item.time}</span>
                        <span className="flex items-center gap-1.5">Instructor: {item.instructor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                    {item.isLive ? (
                      <button 
                        onClick={() => onNavigate?.('student-classroom')}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-[#0056D2] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-lg shadow-blue-100 transition-all"
                      >
                        <Video size={18} />
                        Join Live Class
                      </button>
                    ) : (
                      <button className="flex-1 md:flex-none px-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-sm font-bold border border-gray-100 hover:bg-gray-100 transition-all">
                        Details
                      </button>
                    )}
                    <button className="p-2.5 text-gray-400 hover:text-gray-900 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
              
              <button 
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-bold text-sm hover:border-[#0056D2] hover:text-[#0056D2] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Add Personal Schedule
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
