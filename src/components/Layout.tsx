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
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from './App.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import Logo from './Logo.tsx';

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
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = user?.displayName || t('auth.guest');
  const roleLabel = user
    ? role === 'teacher'
      ? `${t('register.teacher')} • ${t('auth.senior')}`
      : `${t('register.student')} • ${t('auth.hsk_level')}`
    : t('auth.guest_label');

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
    { id: 'reports', label: t('nav.reports'), icon: BarChart3 },
  ];

  const adminItems = [
    { id: 'admin', label: t('admin.title'), icon: Settings },
  ];

  const menuItems = role === 'teacher' ? teacherItems : role === 'admin' ? adminItems : studentItems;

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const notifications = [
    { id: 1, text: 'New assignment: HSK 3 Grammar', time: '2m ago', unread: true },
    { id: 2, text: 'Live session starting in 15m', time: '10m ago', unread: true },
    { id: 3, text: 'Quiz results are out', time: '2h ago', unread: false },
  ];

  return (
    <div id="master-layout" className="flex min-h-screen bg-[#F8F9FA]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {(sidebarOpen || dropdownOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSidebarOpen(false);
              setDropdownOpen(false);
            }}
            className="fixed inset-0 bg-black/5 z-[40] backdrop-blur-[1px]"
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
        <div id="sidebar-logo" className="h-[100px] flex items-center justify-between px-6 border-b border-[#E5E7EB]">
          <button 
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-16 h-16 flex items-center justify-center">
              <Logo size={64} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-none">LingoBridge</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">
                {role === 'teacher' ? t('nav.teachers') : t('nav.students')}
              </span>
            </div>
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
            onClick={() => { logout(); navigateTo('landing'); }}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-red-600 text-sm transition-colors mt-1"
          >
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div id="main-container" className="flex-1 lg:ml-[260px] flex flex-col">
        {/* Header */}
        <header 
          id="app-header"
          className="h-[70px] bg-white border-b border-[#E5E7EB] sticky top-0 px-4 md:px-8 flex items-center justify-between z-[41]"
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
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`p-2 rounded-xl transition-colors relative ${dropdownOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                      <h4 className="font-bold text-gray-900 text-sm">{t('notification.title')}</h4>
                      <button className="text-[10px] text-blue-600 font-bold hover:underline">{t('notification.mark_all')}</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <button 
                          key={n.id} 
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex gap-3 items-start"
                        >
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.unread ? 'bg-blue-600' : 'bg-transparent'}`} />
                          <div>
                            <p className="text-xs text-gray-700 leading-tight mb-1">{n.text}</p>
                            <span className="text-[10px] text-gray-400">{n.time}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-50">
                      <button className="w-full py-1.5 text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors">
                        {t('notification.view_all')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div id="user-profile" className="flex items-center gap-3 border-l border-gray-200 pl-4 md:pl-6 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {roleLabel}
                </p>
              </div>
              {user ? (
                <img 
                  src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0056D2&textColor=ffffff`}
                  alt="Profile" 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-200">
                  <UserIcon size={18} className="text-gray-400" />
                </div>
              )}
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
