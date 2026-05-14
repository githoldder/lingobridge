import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, UserCheck, ChevronLeft, Globe, ArrowRight, School } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface RegisterViewProps {
  onNavigate: (view: 'landing' | 'login' | 'dashboard') => void;
}

const RegisterView = ({ onNavigate }: RegisterViewProps) => {
  const { t } = useLanguage();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="fixed -top-10 -left-10 opacity-5 pointer-events-none select-none">
        <span className="text-[200px] text-on-surface leading-none font-serif">桥</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[500px]"
      >
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">{t('nav.home') || 'Back'}</span>
        </button>

        <div className="bg-white shadow-2xl rounded-[3rem] p-10 lg:p-12 border border-gray-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-6 shadow-xl shadow-primary/30">
              <School size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">{t('nav.register')}</h1>
            <p className="text-sm text-gray-500 font-medium">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                  role === 'student' 
                    ? 'bg-white text-secondary shadow-md' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <User size={16} />
                {t('register.student')}
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                  role === 'teacher' 
                    ? 'bg-white text-secondary shadow-md' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <UserCheck size={16} />
                {t('register.teacher')}
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('register.full_name')}</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  placeholder="Léopold Senghor"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('login.email_label')}</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('login.password_label')}</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  placeholder="Min. 8 characters"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4 px-1">
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary" />
              <p className="text-xs font-medium text-gray-500 leading-normal">
                {t('register.terms')}
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-white font-black text-lg py-5 rounded-[2rem] hover:bg-red-700 active:scale-[0.98] transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 mt-6 group shrink-0"
            >
              <span className="relative z-10">{t('register.get_started')}</span>
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform relative z-10" />
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            {t('register.already_account')} 
            <button 
              onClick={() => onNavigate('login')}
              className="text-primary font-black hover:underline ml-1"
            >
              {t('nav.login')}
            </button>
          </p>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            © 2024 LingoBridge Learning. All Rights Reserved.
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default RegisterView;
