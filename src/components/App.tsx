/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import Layout from './Layout.tsx';
import DashboardView from './DashboardView.tsx';
import ScheduleView from './ScheduleView.tsx';
import HomeworkView from './HomeworkView.tsx';
import VocabularyView from './VocabularyView.tsx';
import HomeView from './HomeView.tsx';
import TeacherDashboardView from './TeacherDashboardView.tsx';
import TeacherCoursesView from './TeacherCoursesView.tsx';
import TeacherClassesView from './TeacherClassesView.tsx';
import TeacherClassroomView from './TeacherClassroomView.tsx';
import TeacherStudentsView from './TeacherStudentsView.tsx';
import TeacherReportsView from './TeacherReportsView.tsx';
import TeacherCourseDetailView from './TeacherCourseDetailView.tsx';
import AdminDashboardView from './AdminDashboardView.tsx';
import LoginView from './LoginView.tsx';
import RegisterView from './RegisterView.tsx';
import ASRDemoView from './ASRDemoView.tsx';
import { motion, AnimatePresence } from 'motion/react';

import { LanguageProvider } from '../context/LanguageContext.tsx';
import { AuthProvider, useAuth } from '../context/AuthContext.tsx';
import { authApi } from '../services/apiClient.ts';
import GuestGate from './GuestGate.tsx';

export type UserRole = 'student' | 'teacher' | 'landing' | 'admin';

export interface NavigationContext {
  lessonNodeId?: string;
  courseId?: string;
}

const PROTECTED_TABS = [
  'dashboard', 'schedule', 'vocabulary', 'homework', 'student-classroom',
  'teacher-dashboard', 'teacher-courses', 'teacher-classes', 'students', 'teacher-classroom', 'reports', 'teacher-course-detail',
  'admin',
];

function AppContent() {
  const [isDemoMode] = useState(() => new URLSearchParams(window.location.search).get('demo') === 'asr');
  const [activeTab, setActiveTab] = useState(isDemoMode ? 'asr-demo' : 'landing');
  const [userRole, setUserRole] = useState<UserRole>('landing');
  const [prevTab, setPrevTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [navContext, setNavContext] = useState<NavigationContext>({});
  const { requireAuth, user, logout, showGuestGate, setShowGuestGate } = useAuth();

  // Auto-navigate to dashboard when user logs in
  React.useEffect(() => {
    // E2E test navigation override via sessionStorage (consumed once)
    const testNav = sessionStorage.getItem('__lingobridge_nav__');
    if (testNav && activeTab === 'landing') {
      try {
        const { tab, ctx } = JSON.parse(testNav);
        if (tab) {
          sessionStorage.removeItem('__lingobridge_nav__');
          setActiveTab(tab);
          if (ctx) setNavContext((prev) => ({ ...prev, ...ctx }));
          return;
        }
      } catch {}
    }

    if (user && activeTab === 'landing') {
      if (user.role === 'teacher') {
        setActiveTab('teacher-dashboard');
        setUserRole('teacher');
      } else if (user.role === 'admin') {
        setActiveTab('admin');
        setUserRole('admin');
      } else {
        setActiveTab('dashboard');
        setUserRole('student');
      }
    }
  }, [user, activeTab]);

  const handleNavigate = useCallback((target: string, ctx?: NavigationContext) => {
    if (PROTECTED_TABS.includes(target)) {
      if (!requireAuth()) return;
    }

    if (target === 'dashboard' || target === 'schedule' || target === 'vocabulary' || target === 'homework' || target === 'student-classroom') setUserRole('student');
    if (target === 'teacher-dashboard' || target === 'teacher-courses' || target === 'teacher-classes' || target === 'students' || target === 'teacher-classroom' || target === 'reports' || target === 'teacher-course-detail') setUserRole('teacher');
    if (target === 'admin') {
      const currentUser = user ?? authApi.currentUser();
      if (currentUser?.role !== 'admin') {
        console.warn('Non-admin user attempted to access admin panel');
        return;
      }
      setUserRole('admin');
    }
    if (target === 'landing') setUserRole('landing');
    
    if (activeTab !== 'teacher-classroom' && activeTab !== 'student-classroom') {
      setPrevTab(activeTab);
    }
    
    if (ctx) {
      setNavContext((prev) => ({ ...prev, ...ctx }));
    }
    setActiveTab(target);
  }, [activeTab, requireAuth, user]);

  const handleClassExit = () => {
    setActiveTab(prevTab);
  };

  const handleOpenCourseDetail = (courseId: string) => {
    setSelectedCourseId(courseId);
    handleNavigate('teacher-course-detail');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        return <HomeView onNavigate={handleNavigate} />;
      case 'login':
        return <LoginView onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterView onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'schedule':
        return <ScheduleView onNavigate={handleNavigate} lessonNodeId={navContext.lessonNodeId} />;
      case 'homework':
        return <HomeworkView lessonNodeId={navContext.lessonNodeId} courseId={navContext.courseId} />;
      case 'vocabulary':
        return <VocabularyView />;
      case 'teacher-dashboard':
        return <TeacherDashboardView onNavigate={handleNavigate} />;
      case 'teacher-courses':
        return <TeacherCoursesView onNavigate={handleNavigate} onOpenCourse={handleOpenCourseDetail} />;
      case 'teacher-classes':
        return <TeacherClassesView />;
      case 'teacher-classroom':
        return <TeacherClassroomView onExit={handleClassExit} role="teacher" lessonNodeId={navContext.lessonNodeId} courseId={navContext.courseId} />;
      case 'student-classroom':
        return <TeacherClassroomView onExit={handleClassExit} role="student" lessonNodeId={navContext.lessonNodeId} courseId={navContext.courseId} />;
      case 'students':
        return <TeacherStudentsView />;
      case 'reports':
        return <TeacherReportsView />;
      case 'teacher-course-detail':
        return <TeacherCourseDetailView courseId={selectedCourseId} onNavigate={handleNavigate} onBack={() => handleNavigate('teacher-courses')} onEnterLive={(courseId, lessonNodeId) => { setNavContext({ courseId, lessonNodeId }); handleNavigate('teacher-classroom'); }} />;
      case 'asr-demo':
        return <ASRDemoView />;
      case 'admin': {
        const currentUser = user ?? authApi.currentUser();
        if (currentUser?.role !== 'admin') {
          return <DashboardView onNavigate={handleNavigate} />;
        }
        return <AdminDashboardView onLogout={() => { logout(); handleNavigate('landing'); }} />;
      }
      default:
        return userRole === 'teacher' ? <TeacherDashboardView /> : <DashboardView />;
    }
  };

  const isClassroom = activeTab === 'teacher-classroom' || activeTab === 'student-classroom';
  const isFullScreen = activeTab === 'landing' || activeTab === 'login' || activeTab === 'register' || isClassroom || activeTab === 'admin' || activeTab === 'asr-demo';

  return (
    <>
      {isFullScreen ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isClassroom ? 0.3 : 0.5 }}
            className={isClassroom ? "fixed inset-0 z-[100]" : ""}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      ) : (
        <Layout activeTab={activeTab} setActiveTab={handleNavigate} role={userRole}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </Layout>
      )}
      <GuestGate
        open={showGuestGate}
        onClose={() => setShowGuestGate(false)}
        onLogin={() => { setShowGuestGate(false); handleNavigate('login'); }}
        onRegister={() => { setShowGuestGate(false); handleNavigate('register'); }}
      />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
