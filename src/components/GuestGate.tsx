import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface GuestGateProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function GuestGate({ open, onClose, onLogin, onRegister }: GuestGateProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 pointer-events-auto relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 text-[#0056D2] rounded-2xl flex items-center justify-center mx-auto">
                  <LogIn size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">{t('guest_gate.title')}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t('guest_gate.description')}</p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={onLogin}
                    className="w-full bg-[#0056D2] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn size={18} />
                    {t('guest_gate.login_btn')}
                  </button>
                  <button
                    onClick={onRegister}
                    className="w-full border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:border-[#0056D2] hover:text-[#0056D2] transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} />
                    {t('guest_gate.register_btn')}
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {t('guest_gate.dismiss')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
