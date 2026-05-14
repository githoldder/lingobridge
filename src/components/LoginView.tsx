import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, ChevronLeft, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../services/apiClient.ts';

interface LoginViewProps {
  onNavigate: (view: string) => void;
}

const LoginView = ({ onNavigate }: LoginViewProps) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('student_a@test.com');
  const [password, setPassword] = useState('Test@123456');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { user } = await authApi.login(email, password);
      onNavigate(user.role === 'teacher' ? 'teacher-dashboard' : 'dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Use teacher@test.com or student_a@test.com with Test@123456.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUqN9gOyqeRj0Mxde1Nt3isVlcijzLeht2Kuyf_5w_L75-jJ2wjpy4YuVwU-DjrkUFnEkJzAJXBv3eEeH3bDFAvnl5M1YjVJ7hx6MIqhcHFuIOJ1sDbWdTOU7SW_PKj1Y5UTl6zZZ5xkd7LoTaQq2QNLLj-yPXiwsfxf4FBlEOiNeHcEZ663muRVCx5EKD7ZFtgIIryzuu0PQbRntRi1NbsJU0Bc3Ej94Idm86L56X80EvLSEv2e-KIxfiCjfO83K7d0rtg3RU0L0t')] bg-cover bg-center grayscale" />
      
      <div className="fixed -bottom-10 -right-10 opacity-5 pointer-events-none select-none">
        <span className="text-[240px] text-on-surface leading-none font-serif">学</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">{t('nav.home') || 'Back'}</span>
        </button>

        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-10 border border-white/50">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Globe size={28} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">LingoBridge</h1>
            </div>
            <p className="text-sm text-gray-500 font-medium">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('login.email_label')}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('login.password_label')}</label>
                <button type="button" className="text-[10px] font-bold text-primary hover:underline">{t('login.forgot_password')}</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-secondary text-white font-bold py-4 rounded-2xl hover:bg-blue-600 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group"
            >
              <span>{isSubmitting ? 'Signing in...' : t('nav.login')}</span>
              <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {error && <p className="text-sm text-red-600 font-bold text-center">{error}</p>}
          </form>

          <div className="relative my-10 flex items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('login.continue_with')}</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale" alt="Google" />
              <span className="text-sm font-bold text-gray-700">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 py-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center text-white text-[10px] font-black">VK</div>
              <span className="text-sm font-bold text-gray-700">VKontakte</span>
            </button>
          </div>

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            {t('login.no_account')}
            <button 
              onClick={() => onNavigate('register')}
              className="text-primary font-black hover:underline ml-1"
            >
              {t('nav.register')}
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

export default LoginView;
