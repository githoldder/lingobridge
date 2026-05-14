import React from 'react';
import { 
  Globe, 
  GraduationCap, 
  BookOpen, 
  Video, 
  Trophy,
  Users,
  PlayCircle,
  Volume2,
  Mic,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import LanguageSwitcher from './LanguageSwitcher.tsx';

import Logo from './Logo.tsx';

interface HomeViewProps {
  onNavigate: (target: string) => void;
}

const HomeView = ({ onNavigate }: HomeViewProps) => {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = React.useState(0);

  const showcaseItems = [
    {
      id: 'recording',
      title: t('showcase.recording.title'),
      desc: t('showcase.recording.desc'),
      device: 'iphone',
      image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop',
      color: 'bg-blue-600',
      icon: Mic
    },
    {
      id: 'meeting',
      title: t('showcase.meeting.title'),
      desc: t('showcase.meeting.desc'),
      device: 'mac',
      image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&auto=format&fit=crop',
      color: 'bg-[#E31E24]',
      icon: Monitor
    },
    {
      id: 'sync',
      title: t('showcase.multi_device.title'),
      desc: t('showcase.multi_device.desc'),
      device: 'ipad',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1000&auto=format&fit=crop',
      color: 'bg-green-600',
      icon: Smartphone
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % showcaseItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [showcaseItems.length]);

  return (
    <div id="home-view" className="min-h-screen bg-white text-gray-900 font-sans selection:bg-red-100 selection:text-red-600">
      {/* Navigation */}
      <header id="home-nav" className="fixed top-0 w-full z-50 bg-white border-b border-gray-100 h-24 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 flex items-center justify-center">
            <Logo size={96} />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none tracking-tight">{t('app.logo.title')}</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">{t('app.logo.subtitle')}</div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-500">
            <a href="#" className="hover:text-[#E31E24] transition-colors">{t('nav.methodology')}</a>
            <a href="#" className="hover:text-[#E31E24] transition-colors">{t('nav.courses')}</a>
            <a href="#" className="hover:text-[#E31E24] transition-colors">{t('nav.teachers')}</a>
          </div>
          
          <div className="flex items-center gap-4 border-l border-gray-100 pl-8">
            <LanguageSwitcher />
            <button 
              onClick={() => onNavigate('login')}
              className="text-sm font-bold text-gray-700 hover:text-[#E31E24] transition-colors"
            >
              {t('nav.login')}
            </button>
            <button 
              onClick={() => onNavigate('register')}
              className="bg-[#E31E24] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95"
            >
              {t('nav.register')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home-hero" className="pt-40 pb-24 px-6 md:px-12 bg-gradient-to-br from-red-50/50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight font-jakarta">
              {t('hero.title').split(' ').slice(0, 2).join(' ')} <br />
              <span className="text-[#E31E24]">{t('hero.title').split(' ').slice(2).join(' ')}</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="group relative overflow-hidden px-10 py-5 rounded-2xl font-bold text-lg text-gray-700 border-2 border-gray-100 backdrop-blur-md bg-white/30 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,86,210,0.15)] ring-1 ring-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-[#0056D2] to-[#3b82f6] translate-x-[101%] translate-y-[101%] group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <GraduationCap size={24} className="relative z-10 group-hover:text-white transition-colors duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">{t('hero.student_btn')}</span>
              </button>
              
              <button 
                onClick={() => onNavigate('teacher-dashboard')}
                className="group relative overflow-hidden px-10 py-5 rounded-2xl font-bold text-lg text-gray-700 border-2 border-gray-100 backdrop-blur-md bg-white/30 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(227,30,36,0.15)] ring-1 ring-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-[#E31E24] to-[#f87171] translate-x-[101%] translate-y-[101%] group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <Users size={24} className="relative z-10 group-hover:text-white transition-colors duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">{t('hero.teacher_btn')}</span>
              </button>
            </div>
            
            <p className="text-gray-400 text-sm font-medium">
              {t('hero.login_prompt')} <button onClick={() => onNavigate('login')} className="text-gray-900 font-bold hover:underline">{t('nav.login')}</button>
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 5 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="w-[320px] h-[650px] bg-white rounded-[3.5rem] shadow-2xl border-[12px] border-gray-900 overflow-hidden relative">
              {/* Phone Notch */}
              <div className="absolute top-0 w-full h-8 bg-gray-900 flex justify-center items-end pb-1.5 z-20">
                <div className="w-24 h-4 bg-black rounded-full" />
              </div>
              
              {/* Phone Content Mockup */}
              <div className="p-6 pt-12 flex flex-col h-full bg-white">
                <div className="flex justify-between items-center mb-10 text-gray-900">
                  <span className="text-xs font-bold text-gray-400">{t('showcase.lesson_label')}</span>
                  <div className="flex gap-1">
                    <div className="w-5 h-1.5 bg-[#0056D2] rounded-full" />
                    <div className="w-5 h-1.5 bg-gray-100 rounded-full" />
                    <div className="w-5 h-1.5 bg-gray-100 rounded-full" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-7xl font-bold text-gray-900 mb-4 font-noto">妈妈</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-medium text-gray-400 italic">{t('showcase.phonetic')}</span>
                    <div className="p-2 bg-blue-50 text-[#0056D2] rounded-full">
                      <Volume2 size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-600">{t('showcase.meaning')}</div>
                </div>

                <div className="mt-auto space-y-6">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-gray-900">
                    <p className="text-sm font-bold mb-1 font-noto">{t('showcase.example_zh')}</p>
                    <p className="text-xs text-gray-500 italic">{t('showcase.example_en')}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border-2 border-gray-100 rounded-2xl h-24 flex items-center justify-center text-4xl font-bold text-gray-300 font-noto">妈</div>
                    <div className="bg-green-50 rounded-2xl h-24 flex items-center justify-center text-green-500">
                      <PlayCircle size={48} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 -bottom-20 -right-20 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-30" />
            <div className="absolute -z-10 -top-20 -left-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30" />
          </motion.div>
        </div>
      </section>

      {/* Product Showcase - Horizontal Carousel */}
      <section className="py-32 px-6 md:px-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold text-gray-900 font-jakarta">{t('nav.methodology')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">{t('showcase.optimized_desc')}</p>
          </div>

          <div className="relative">
             <div className="flex overflow-hidden">
                <motion.div 
                  className="flex"
                  animate={{ x: `-${activeIndex * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {showcaseItems.map((item) => (
                    <div key={item.id} className="min-w-full px-4">
                      <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-16 bg-gray-50/50 rounded-[3rem] p-6 lg:p-10 border border-gray-100 min-h-[500px] lg:min-h-[580px] overflow-hidden">
                        <div className="space-y-6 lg:pl-6">
                          <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center shadow-2xl`}>
                            <item.icon size={28} />
                          </div>
                          <div className="space-y-3">
                            <h2 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">
                              {item.title}
                            </h2>
                            <p className="text-base lg:text-lg text-gray-500 leading-relaxed max-w-md font-medium">
                              {item.desc}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <span className="px-3 py-1 bg-white text-gray-500 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider">{t('showcase.ai_core')}</span>
                            <span className="px-3 py-1 bg-white text-gray-500 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider">{t('showcase.low_latency')}</span>
                            <span className="px-3 py-1 bg-white text-gray-500 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider">{t('showcase.multi_lang')}</span>
                          </div>
                        </div>

                        <div className="relative flex justify-center items-center w-full px-4 lg:px-0">
                          {/* Device Frames */}
                          {item.device === 'mac' && (
                            <div className="relative w-full max-w-[580px] transform transition-transform duration-700 hover:scale-[1.02]">
                              <div className="relative bg-[#252526] rounded-t-[2rem] p-3 shadow-2xl border-t border-x border-gray-100/10">
                                <div className="bg-[#1e1e1e] rounded-t-[1.5rem] overflow-hidden aspect-[16/10] relative border border-white/5">
                                   <img src={item.image} className="w-full h-full object-cover opacity-90" alt={item.title} />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                   <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                                        <PlayCircle size={20} />
                                      </div>
                                      <div className="text-white">
                                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">{t('showcase.now_live')}</div>
                                        <div className="text-xs font-bold">{t('showcase.lesson_title')}</div>
                                      </div>
                                   </div>
                                </div>
                              </div>
                              <div className="h-4 bg-[#323233] rounded-b-xl shadow-2xl w-full relative z-10 border-b-2 border-gray-400/20" />
                            </div>
                          )}

                          {item.device === 'iphone' && (
                            <div className="relative w-[240px] h-[480px] bg-[#1a1a1a] rounded-[3rem] p-3.5 shadow-2xl border-4 border-gray-800/50 transform -rotate-1 hover:rotate-0 transition-transform duration-700">
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20 flex items-center justify-center">
                                 <div className="w-10 h-1 bg-gray-800 rounded-full" />
                              </div>
                              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative border border-white/10">
                                <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] bg-black/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 text-white shadow-2xl">
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">{t('classroom.recording')}</span>
                                     <div className="flex gap-1">
                                        {[1,2,3].map(i => <div key={i} className="w-0.5 h-2 bg-blue-400 rounded-full animate-pulse" />)}
                                     </div>
                                  </div>
                                  <div className="text-base font-bold font-noto mb-0.5">明天见 (Míngtiān jiàn)</div>
                                  <div className="text-[10px] font-medium text-gray-400 italic">"See you tomorrow"</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {item.device === 'ipad' && (
                            <div className="relative w-full max-w-[440px] aspect-[4/3] bg-[#1a1a1a] rounded-[2.5rem] p-4 shadow-2xl border-4 border-gray-800/50 ring-1 ring-white/10 transform rotate-1 hover:rotate-0 transition-transform duration-700">
                              <div className="w-full h-full bg-indigo-950 rounded-[1.8rem] overflow-hidden relative border border-white/10 shadow-inner">
                                <img src={item.image} className="w-full h-full object-cover opacity-40 mix-blend-overlay" alt={item.title} />
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/60 via-transparent to-transparent" />
                                <div className="absolute top-6 left-6 flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 flex items-center justify-center text-white">
                                      <Monitor size={20} />
                                   </div>
                                   <div className="text-white">
                                      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">{t('showcase.multi_device.title')}</div>
                                      <div className="text-xs font-bold">{t('showcase.cloud_presence')}</div>
                                   </div>
                                </div>
                                <div className="absolute bottom-6 right-6">
                                   <button className="px-5 py-2.5 bg-[#E31E24] text-white rounded-xl shadow-xl shadow-red-600/20 font-bold text-xs flex items-center gap-2 hover:bg-red-500 transition-all active:scale-95">
                                      {t('dashboard.continue')}
                                      <ArrowRight size={16} />
                                   </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
             </div>

             {/* Carousel Controls */}
             <div className="flex justify-center gap-4 mt-12">
                {showcaseItems.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === i ? 'w-12 bg-[#E31E24]' : 'w-2.5 bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-32 px-6 md:px-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-extrabold text-gray-900 font-jakarta">{t('steps.title')}</h2>
            <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">{t('steps.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-gray-900">
            <div className="text-center group bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-red-50 transition-all duration-300">
              <div className="w-24 h-24 bg-red-50 text-[#E31E24] rounded-3xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                <BookOpen size={40} />
              </div>
              <h3 className="text-xl font-bold mb-4">{t('feature.step1.title')}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{t('feature.step1.desc')}</p>
            </div>
            <div className="text-center group bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300">
              <div className="w-24 h-24 bg-blue-50 text-[#0056D2] rounded-3xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300">
                <Video size={40} />
              </div>
              <h3 className="text-xl font-bold mb-4">{t('feature.step2.title')}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{t('feature.step2.desc')}</p>
            </div>
            <div className="text-center group bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-green-50 transition-all duration-300">
              <div className="w-24 h-24 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                <Trophy size={40} />
              </div>
              <h3 className="text-xl font-bold mb-4">{t('feature.step3.title')}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{t('feature.step3.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Carousel */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 font-jakarta">{t('partners.title')}</h2>
          <div className="w-20 h-1 bg-[#E31E24] mx-auto mt-4 rounded-full opacity-20" />
        </div>

        <div className="relative space-y-12">
          {/* Row 1: RU/KZ -> Right */}
          <div className="flex gap-12 animate-marquee-right whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-12 items-center">
                {[
                  { name: 'MSU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Moscow_State_University_logo.svg/200px-Moscow_State_University_logo.svg.png' },
                  { name: 'SPbU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Saint_Petersburg_State_University_logo.svg/200px-Saint_Petersburg_State_University_logo.svg.png' },
                  { name: 'Nazarbayev University', logo: 'https://nu.edu.kz/wp-content/uploads/2017/05/NU-logo-horizontal-En.png' },
                  { name: 'KFU', logo: 'https://upload.wikimedia.org/wikipedia/ru/thumb/9/9d/Kazan_Federal_University_logo.svg/200px-Kazan_Federal_University_logo.svg.png' },
                  { name: 'HSE', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e6/Higher_School_of_Economics_logo.svg/200px-Higher_School_of_Economics_logo.svg.png' }
                ].map((uni, idx) => (
                  <div key={idx} className="h-16 w-48 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                    <img src={uni.logo} alt={uni.name} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Row 2: CN -> Left */}
          <div className="flex gap-12 animate-marquee-left whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-12 items-center">
                {[
                  { name: 'Tsinghua', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/Tsinghua_University_Logo.svg/200px-Tsinghua_University_Logo.svg.png' },
                  { name: 'Peking', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Peking_University_logo.svg/200px-Peking_University_logo.svg.png' },
                  { name: 'Fudan', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Fudan_University_logo.svg/200px-Fudan_University_logo.svg.png' },
                  { name: 'Zhejiang', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Zhejiang_University_Logo.svg/200px-Zhejiang_University_Logo.svg.png' },
                  { name: 'Shanghai Jiao Tong', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/Shanghai_Jiao_Tong_University_logo.svg/200px-Shanghai_Jiao_Tong_University_logo.svg.png' }
                ].map((uni, idx) => (
                  <div key={idx} className="h-16 w-48 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                    <img src={uni.logo} alt={uni.name} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-24 bg-gray-50 border-y border-gray-100 text-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-16 md:gap-32">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#0056D2]">
              <Users size={32} />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">12,000+</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('stats.learners')}</div>
            </div>
          </div>
          <div className="hidden md:block w-px h-16 bg-gray-200" />
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#E31E24]">
              <Globe size={32} />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">30+</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('stats.partners')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-32 pb-12 px-6 md:px-12 bg-white border-t border-gray-50 text-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-6 text-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <Logo size={80} />
              </div>
              <span className="text-xl font-bold tracking-tight">{t('app.logo.title')}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {t('footer.desc')}
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="font-bold text-gray-900">{t('footer.education')}</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.courses_syllabus')}</a></li>
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.teachers')}</a></li>
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.mobile')}</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-gray-900">{t('footer.support')}</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.help')}</a></li>
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.contact')}</a></li>
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.docs')}</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-gray-900">{t('footer.legal')}</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-[#E31E24] transition-colors">{t('footer.terms')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <LanguageSwitcher />
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
            {t('footer.rights')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeView;
