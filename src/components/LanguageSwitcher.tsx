import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext.tsx';
import { motion, AnimatePresence } from 'motion/react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: 'https://flagicons.lipis.dev/flags/4x3/gb.svg' },
    { code: 'zh', label: '中文', flag: 'https://flagicons.lipis.dev/flags/4x3/cn.svg' },
    { code: 'ru', label: 'Русский', flag: 'https://flagicons.lipis.dev/flags/4x3/ru.svg' },
    { code: 'kk', label: 'Қазақша', flag: 'https://flagicons.lipis.dev/flags/4x3/kz.svg' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700"
      >
        <img src={currentLang.flag} alt={currentLang.label} className="w-5 h-3.5 rounded-sm object-cover" />
        <span className="uppercase">{currentLang.code}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors hover:bg-gray-50 ${language === lang.code ? 'text-[#0056D2] bg-blue-50/50' : 'text-gray-600'}`}
                >
                  <img src={lang.flag} alt={lang.label} className="w-5 h-3.5 rounded-sm object-cover" />
                  {lang.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
