/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Layout from './Layout.tsx';
import DashboardView from './DashboardView.tsx';
import ScheduleView from './ScheduleView.tsx';
import HomeworkView from './HomeworkView.tsx';
import VocabularyView from './VocabularyView.tsx';
import HomeView from './HomeView.tsx';
import TeacherDashboardView from './TeacherDashboardView.tsx';
import TeacherCoursesView from './TeacherCoursesView.tsx';
import TeacherClassroomView from './TeacherClassroomView.tsx';
import StudentClassroomView from './StudentClassroomView.tsx';
import TeacherStudentsView from './TeacherStudentsView.tsx';
import TeacherReportsView from './TeacherReportsView.tsx';
import LoginView from './LoginView.tsx';
import RegisterView from './RegisterView.tsx';
import { motion, AnimatePresence } from 'motion/react';

import { LanguageProvider } from '../context/LanguageContext.tsx';

export type UserRole = 'student' | 'teacher' | 'landing';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [userRole, setUserRole] = useState<UserRole>('landing');
  const [prevTab, setPrevTab] = useState('dashboard');

  const handleNavigate = (target: string) => {
    if (target === 'dashboard' || target === 'schedule' || target === 'vocabulary' || target === 'homework' || target === 'student-classroom') setUserRole('student');
    if (target === 'teacher-dashboard' || target === 'teacher-courses' || target === 'students' || target === 'teacher-classroom' || target === 'reports') setUserRole('teacher');
    if (target === 'landing') setUserRole('landing');
    
    // Track previous tab for classroom return
    if (activeTab !== 'teacher-classroom' && activeTab !== 'student-classroom') {
      setPrevTab(activeTab);
    }
    
    setActiveTab(target);
  };

  const handleClassExit = () => {
    setActiveTab(prevTab);
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
        return <ScheduleView onNavigate={handleNavigate} />;
      case 'homework':
        return <HomeworkView />;
      case 'vocabulary':
        return <VocabularyView />;
      case 'teacher-dashboard':
        return <TeacherDashboardView onNavigate={handleNavigate} />;
      case 'teacher-courses':
        return <TeacherCoursesView onNavigate={handleNavigate} />;
      case 'teacher-classroom':
        return <TeacherClassroomView onExit={handleClassExit} />;
      case 'student-classroom':
        return <StudentClassroomView onExit={handleClassExit} />;
      case 'students':
        return <TeacherStudentsView />;
      case 'reports':
        return <TeacherReportsView />;
      default:
        return userRole === 'teacher' ? <TeacherDashboardView /> : <DashboardView />;
    }
  };

  const isClassroom = activeTab === 'teacher-classroom' || activeTab === 'student-classroom';
  const isFullScreen = activeTab === 'landing' || activeTab === 'login' || activeTab === 'register' || isClassroom;

  return (
    <LanguageProvider>
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
    </LanguageProvider>
  );
}
