import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  HelpCircle,
  LogOut,
  GraduationCap,
  MessageSquare,
  Video,
  Menu,
  X,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from './App.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

import LanguageSwitcher from './LanguageSwitcher.tsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

const SidebarItem = ({ icon: Icon, label, id, active, onClick }: any) => (
  <button
    id={`sidebar-item-${id}`}
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-6 py-4 transition-colors relative ${
      active 
        ? 'text-[#0056D2] font-semibold bg-blue-50/50' 
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    <Icon size={20} />
    <span className="text-sm">{label}</span>
    {active && (
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#0056D2]" />
    )}
  </button>
);

export default function Layout({ children, activeTab, setActiveTab, role }: LayoutProps) {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentItems = [
    { id: 'dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { id: 'schedule', label: t('dashboard.schedule'), icon: Calendar },
    { id: 'homework', label: t('nav.homework'), icon: ClipboardCheck },
    { id: 'vocabulary', label: t('nav.vocabulary'), icon: BookOpen },
  ];

  const teacherItems = [
    { id: 'teacher-dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { id: 'teacher-courses', label: t('nav.courses'), icon: GraduationCap },
    { id: 'students', label: t('nav.students'), icon: Users },
    { id: 'teacher-classroom', label: t('nav.classroom'), icon: Video },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3 },
  ];

  const menuItems = role === 'teacher' ? teacherItems : studentItems;

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div id="master-layout" className="flex min-h-screen bg-[#F8F9FA]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-[45] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        id="app-sidebar"
        className={`w-[260px] bg-white border-r border-[#E5E7EB] fixed h-full z-50 transition-transform duration-300 transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div id="sidebar-logo" className="h-[70px] flex items-center justify-between px-6 border-b border-[#E5E7EB]">
          <button 
            onClick={() => navigateTo('landing')}
            className="flex flex-col hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-bold text-[#E31E24]">HanBridge</span>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
              {role === 'teacher' ? 'Instructor Portal' : 'Student Portal'}
            </span>
          </button>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav id="sidebar-nav" className="py-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.id}
              onClick={navigateTo}
            />
          ))}
        </nav>

        <div id="sidebar-footer" className="absolute bottom-0 w-full p-4 border-t border-[#E5E7EB]">
          <button className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-gray-900 text-sm transition-colors">
            <Settings size={18} />
            <span>{t('classroom.settings')}</span>
          </button>
          <button 
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-red-600 text-sm transition-colors mt-1"
          >
            <LogOut size={18} />
            <span>{t('classroom.leave')}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div id="main-container" className="flex-1 lg:ml-[260px] flex flex-col">
        {/* Header */}
        <header 
          id="app-header"
          className="h-[70px] bg-white border-b border-[#E5E7EB] sticky top-0 px-4 md:px-8 flex items-center justify-between z-30"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div id="header-search" className="relative hidden md:block w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t('vocab.search_placeholder')} 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div id="header-actions" className="flex items-center gap-2 md:gap-6">
            <LanguageSwitcher />
            <button className="p-2 text-gray-400 hover:text-gray-900 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            
            <div id="user-profile" className="flex items-center gap-3 border-l border-gray-200 pl-4 md:pl-6 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {role === 'teacher' ? 'Teacher Li' : 'Anna Zhang'}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {role === 'teacher' ? 'Instructor • Senior' : 'Student • Level HSK 3'}
                </p>
              </div>
              <img 
                src={role === 'teacher' 
                  ? "https://images.unsplash.com/photo-1544717297-ba2ef95029ee?q=80&w=400&auto=format&fit=crop"
                  : "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&auto=format&fit=crop&q=60"
                } 
                alt="Profile" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-200"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main id="content-area" className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
