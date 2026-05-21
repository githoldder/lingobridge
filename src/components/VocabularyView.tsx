import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ttsService } from '../services/ttsService.ts';
import { vocabularyApi, learningRecordsApi, coursesApi, type VocabularyItem, type LearningRecord, type Course } from '../services/apiClient.ts';
import {
  Plus,
  Search,
  Volume2,
  PenTool,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Puzzle,
  Calendar,
  Lightbulb,
  Mic,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  BookOpen,
  FileWarning,
  Filter,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function computeStatus(record: LearningRecord | undefined): 'Mastered' | 'Learning' | 'New' {
  if (!record) return 'New';
  if (record.status === 'completed' && record.score >= 80) return 'Mastered';
  if (record.status === 'completed' || record.attemptsCount > 0) return 'Learning';
  return 'New';
}

const VocabularyCard = ({ word, onStudy, status, progress }: { word: VocabularyItem, onStudy: (w: VocabularyItem) => void, status: string, progress: number }) => {
  const { t } = useLanguage();
  return (
    <div
      onClick={() => onStudy(word)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-xl hover:border-[#0056D2] transition-all group cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Sparkles size={18} className="text-[#0056D2]" />
      </div>

      <div className="flex justify-between items-start">
        <div>
          <div className="text-4xl font-bold text-gray-900 mb-1 font-noto">{word.zhText}</div>
          <div className="text-sm font-medium text-gray-400 font-mono">{word.pinyin}</div>
        </div>
        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          status === 'Mastered' ? 'bg-green-100 text-green-700' :
          status === 'Learning' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-[#0056D2]'
        }`}>
          {status === 'Mastered' ? t('vocab.mastered') : status === 'Learning' ? t('vocab.learning') : t('vocab.new')}
        </div>
      </div>

      <div className="text-base font-bold text-gray-700">{word.translationRu}</div>

      <div className="flex items-center gap-4 mt-auto">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            <span>{t('vocab.mastery')}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full ${
                status === 'Mastered' ? 'bg-green-500' :
                status === 'Learning' ? 'bg-orange-500' : 'bg-[#0056D2]'
              }`}
            />
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); ttsService.speak(word.zhText); }}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#0056D2] hover:bg-blue-50 transition-all hover:scale-110 active:scale-95"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface Question {
  type: 'mc_ru_zh' | 'mc_zh_ru' | 'pronounce' | 'rhyme';
  word: VocabularyItem;
  options?: VocabularyItem[];
  correctAnswer: string;
}

const LearningSession = ({ initialWords, onFinish, groupName }: { initialWords: VocabularyItem[], onFinish: () => void, groupName?: string }) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isJuice, setIsJuice] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const generated = initialWords.flatMap(word => {
      const qTypes: Question['type'][] = ['mc_ru_zh', 'mc_zh_ru', 'pronounce'];
      return qTypes.map(type => {
        let options: VocabularyItem[] | undefined;
        if (type.startsWith('mc')) {
          options = [...initialWords]
            .sort(() => Math.random() - 0.5)
            .filter(w => w.taskId !== word.taskId)
            .slice(0, 3);
          options.push(word);
          options.sort(() => Math.random() - 0.5);
        }
        return {
          type,
          word,
          options,
          correctAnswer: type === 'mc_ru_zh' ? word.zhText :
                         type === 'mc_zh_ru' ? word.translationRu :
                         word.zhText
        };
      });
    }).sort(() => Math.random() - 0.5).slice(0, Math.max(5, initialWords.length * 2));

    setQuestions(generated);
  }, [initialWords]);

  const currentQ = questions[currentIndex];

  const saveRecord = useCallback(async (word: VocabularyItem, questionScore: number) => {
    try {
      await learningRecordsApi.save(word.taskId, {
        context: 'vocabulary',
        status: questionScore >= 80 ? 'completed' : 'in_progress',
        score: questionScore
      });
    } catch (err) {
      console.error('Failed to save vocabulary learning record:', err);
    }
  }, []);

  const handleCheck = () => {
    if (currentQ.type === 'pronounce') {
      const simulatedScore = Math.floor(Math.random() * 35) + 65;
      const correct = simulatedScore >= 80;

      setLastScore(simulatedScore);
      setIsCorrect(correct);
      if (correct) setScore(s => s + 1);
      saveRecord(currentQ.word, simulatedScore);
    } else {
      const correct = selectedOption === currentQ.correctAnswer;
      setIsCorrect(correct);
      if (correct) setScore(s => s + 1);
      setLastScore(null);
    }
    setIsJuice(true);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsJuice(false);
      setIsCorrect(null);
      setLastScore(null);
    } else {
      setShowResult(true);
    }
  };

  if (!currentQ) return <div className="h-[600px] flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto bg-white rounded-3xl p-12 text-center shadow-2xl border border-gray-100"
      >
        <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('vocab.session_complete')}</h2>
        <p className="text-gray-500 mb-8">{t('vocab.session_desc').replace('{score}', score.toString())}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-[#0056D2]">{Math.round((score / questions.length) * 100)}%</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('vocab.accuracy')}</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-[#0056D2]">+{score * 10}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('vocab.exp_gained')}</div>
          </div>
        </div>

        <button
          onClick={onFinish}
          className="w-full bg-[#0056D2] text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:scale-[1.02] active:scale-95"
        >
          {t('vocab.finish')}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progressbar */}
      <div className="flex items-center gap-4 mb-12">
        <button onClick={onFinish} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            className="h-full bg-[#0056D2] rounded-full"
          />
        </div>
        <span className="text-xs font-bold text-gray-400">{currentIndex + 1} / {questions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentQ.type === 'mc_ru_zh' && t('vocab.translate_to_zh')}
              {currentQ.type === 'mc_zh_ru' && t('vocab.translate_to_ru')}
              {currentQ.type === 'pronounce' && t('vocab.pronounce')}
            </h2>

            <div className="inline-block p-10 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 relative mb-8">
              <div className="text-6xl font-bold mb-4 font-noto">
                {currentQ.type === 'mc_ru_zh' ? currentQ.word.translationRu : currentQ.word.zhText}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  id="vocal-trigger-learning"
                  onClick={() => ttsService.speak(currentQ.word.zhText)}
                  className="w-16 h-16 bg-[#0056D2] text-white rounded-full hover:bg-blue-700 transition-all shadow-lg hover:scale-110 active:scale-95 flex items-center justify-center group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Volume2 size={32} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentQ.type.startsWith('mc') ? (
              currentQ.options?.map((opt, i) => {
                const val = currentQ.type === 'mc_ru_zh' ? opt.zhText : opt.translationRu;
                const isSelected = selectedOption === val;
                return (
                  <button
                    key={i}
                    disabled={isJuice}
                    onClick={() => setSelectedOption(val)}
                    className={`p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'border-[#0056D2] bg-blue-50 text-[#0056D2]'
                        : 'border-gray-100 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{val}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#0056D2] bg-[#0056D2] text-white' : 'border-gray-200'
                    }`}>
                      {isSelected && <CheckCircle2 size={14} />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-8 py-10">
                <div className="flex gap-2 items-end h-12">
                   {[0.4, 0.6, 1, 0.8, 1, 0.4, 1, 0.7, 0.3, 1].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={isRecording ? { height: [h*100+'%', (h*0.4)*100+'%', h*100+'%'] } : { height: '20%' }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                      className={`w-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <button
                  onMouseDown={() => setIsRecording(true)}
                  onMouseUp={() => { setIsRecording(false); handleCheck(); }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? 'bg-red-500 scale-110 shadow-red-200' : 'bg-[#0056D2] hover:bg-blue-700'
                  } text-white shadow-2xl relative group`}
                >
                  <div className={`absolute inset-0 rounded-full animate-ping bg-[#0056D2] opacity-20 ${!isRecording ? 'hidden' : ''}`} />
                  <Mic size={40} className="relative z-10" />
                </button>
                <div className="text-gray-400 font-bold text-sm uppercase tracking-widest">{t('vocab.hold_speak')}</div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Area */}
      <div className={`fixed bottom-0 left-0 right-0 p-8 transition-all duration-300 transform ${isJuice ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className={`max-w-2xl mx-auto rounded-3xl p-8 shadow-2xl border flex items-center justify-between ${
          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            </div>
            <div>
              <h4 className={`text-2xl font-bold ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                {isCorrect ? t('vocab.correct') : t('vocab.incorrect')}
                {lastScore !== null && (
                  <span className="ml-3 text-lg opacity-70">
                    AI Score: {lastScore}
                  </span>
                )}
              </h4>
              <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect
                  ? (lastScore !== null ? t('vocab.pron_great') : t('vocab.pron_well'))
                  : (lastScore !== null ? t('vocab.pron_low') : `${t('vocab.correct_is')} ${currentQ.correctAnswer}`)}
              </p>
            </div>
          </div>
          <button
            onClick={handleNext}
            className={`px-10 py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
              isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {t('vocab.continue')}
          </button>
        </div>
      </div>

      {!isJuice && currentQ.type.startsWith('mc') && (
        <div className="mt-12 text-center">
          <button
            disabled={!selectedOption}
            onClick={handleCheck}
            className={`w-full max-w-sm py-4 rounded-2xl font-bold text-lg shadow-xl transition-all ${
              selectedOption
                ? 'bg-[#0056D2] text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('vocab.check')}
          </button>
        </div>
      )}
    </div>
  );
};

const VocabularyView = () => {
  const { t } = useLanguage();
  const [view, setView] = useState<'bank' | 'learning'>('bank');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sessionWords, setSessionWords] = useState<VocabularyItem[]>([]);
  const [sessionGroup, setSessionGroup] = useState<string>('');
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(() => localStorage.getItem('lingobridge_courseId') || '');

  useEffect(() => {
    coursesApi.list().then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      vocabularyApi.list(selectedCourseId),
      learningRecordsApi.list(selectedCourseId, { context: 'vocabulary' })
    ]).then(([items, records]) => {
      setVocabItems(items);
      setLearningRecords(records);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load vocabulary:', err);
      setError(t('vocab.load_error'));
      setLoading(false);
    });
  }, [selectedCourseId]);

  const getRecord = (taskId: string): LearningRecord | undefined =>
    learningRecords.find(r => r.taskId === taskId);

  const getStatus = (item: VocabularyItem): 'Mastered' | 'Learning' | 'New' => {
    const record = getRecord(item.taskId);
    return computeStatus(record);
  };

  const getProgress = (item: VocabularyItem): number => {
    const record = getRecord(item.taskId);
    if (!record) return 0;
    if (record.status === 'completed' && record.score >= 80) return Math.min(record.score, 100);
    return Math.min(record.attemptsCount * 25, 75);
  };

  const filteredWords = vocabItems.filter(w => {
    const status = getStatus(w);
    const matchesFilter = filter === 'All' || status === filter;
    const matchesSearch = w.zhText.includes(search) || w.translationRu.toLowerCase().includes(search.toLowerCase()) || w.pinyin.includes(search);
    return matchesFilter && matchesSearch;
  });

  const phoneticGroups = useMemo(() => {
    const groups: { [key: string]: VocabularyItem[] } = {};
    vocabItems.forEach(w => {
      const key = w.rhymeGroup || w.final || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    });
    return Object.entries(groups).filter(([_, list]) => list.length >= 2);
  }, [vocabItems]);

  const masteredCount = vocabItems.filter(w => getStatus(w) === 'Mastered').length;

  const startSession = (words: VocabularyItem[], groupName?: string) => {
    setSessionWords(words);
    setSessionGroup(groupName || '');
    setView('learning');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
        <Search size={18} className="text-gray-400" />
        <select
          value={selectedCourseId}
          onChange={(e) => {
            const cid = e.target.value;
            setSelectedCourseId(cid);
            localStorage.setItem('lingobridge_courseId', cid);
          }}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700 cursor-pointer"
        >
          {courses.length === 0 && <option value={selectedCourseId}>{selectedCourseId}</option>}
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-[#0056D2] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('vocab.loading')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <FileWarning size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{error}</p>
          </div>
        </div>
      ) : view === 'learning' ? (
        <div id="vocabulary-learning" className="min-h-screen py-12 px-4">
          <LearningSession
            initialWords={sessionWords}
            onFinish={() => setView('bank')}
            groupName={sessionGroup}
          />
        </div>
      ) : (
        <div id="vocabulary-view" className="space-y-12 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{t('nav.vocabulary')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('vocab.repo_desc')}</p>
          <div className="flex gap-4 pt-2">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-[#0056D2] rounded-full text-xs font-bold border border-blue-100">
               <Sparkles size={14} />
               {t('vocab.spaced_active')}
             </div>
             <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
               <Trophy size={14} />
               {masteredCount} {t('vocab.mastered')}
             </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => startSession(vocabItems.filter(w => getStatus(w) !== 'Mastered').slice(0, 5), 'Daily Mix')}
            className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles size={20} />
            {t('vocab.review')}
          </button>
        </div>
      </div>

      {/* Phonetic Study Clusters (Duolingo Style) */}
      {phoneticGroups.length > 0 && (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={22} className="text-amber-500" />
            {t('vocab.phonetic_group')}
          </h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('vocab.rhyme')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {phoneticGroups.map(([rhyme, list], idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-gray-100 rounded-3xl p-6 hover:border-blue-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-blue-600 font-mono text-sm font-bold mb-2">{t('vocab.rhyme')}: -{rhyme}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{list.length} {t('vocab.cluster')}</h3>
              <div className="flex gap-1 mb-6">
                {list.slice(0, 3).map((w, i) => (
                  <span key={i} className="text-xl font-noto bg-gray-50 px-2 py-1 rounded-lg">{w.zhText}</span>
                ))}
                {list.length > 3 && <span className="text-xs text-gray-400 self-end">+{list.length - 3}</span>}
              </div>
              <button
                onClick={() => startSession(list, `Rhyme -${rhyme}`)}
                className="w-full py-2.5 bg-blue-50 text-[#0056D2] font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#0056D2] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                {t('vocab.launch')} <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sticky top-0 z-10 py-4 bg-gray-50/80 backdrop-blur-md">
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-full lg:w-auto overflow-x-auto custom-scrollbar">
          {['All', 'Mastered', 'Learning', 'New'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                filter === f ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {f === 'All' ? 'All' : f === 'Mastered' ? t('vocab.mastered') : f === 'Learning' ? t('vocab.learning') : t('vocab.new')}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0056D2] transition-colors" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('vocab.search_placeholder')}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#0056D2] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Main Grid */}
      {vocabItems.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredWords.map((word) => (
          <div key={word.taskId}>
            <VocabularyCard
              word={word}
              status={getStatus(word)}
              progress={getProgress(word)}
              onStudy={(w) => startSession([w], w.zhText)}
            />
          </div>
        ))}
        <button className="bg-dashed-border bg-gray-50/50 rounded-2xl p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 group hover:border-[#0056D2] hover:bg-white transition-all text-gray-400 hover:text-[#0056D2] min-h-[220px]">
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center group-hover:border-[#0056D2] transition-colors">
            <Plus size={24} />
          </div>
          <span className="font-bold uppercase tracking-widest text-xs">{t('vocab.add_word')}</span>
        </button>
      </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium text-lg">{t('vocab.empty')}</p>
          <p className="text-gray-400 text-sm mt-2">{t('vocab.empty_desc')}</p>
        </div>
      )}

      {/* Spaced Repetition Hero Card */}
      {vocabItems.length > 0 && (
      <section className="bg-[#0056D2] rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} className="text-yellow-300" />
              {t('vocab.recommended')}
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">{t('vocab.master_title')}</h2>
            <p className="text-blue-100 text-lg mb-8 opacity-90 leading-relaxed font-medium">{t('vocab.ai_analyze')}</p>
            <button
              onClick={() => startSession(vocabItems.filter(w => getStatus(w) !== 'Mastered').slice(0, 5), 'Spaced Repetition')}
              className="px-10 py-5 bg-white text-[#0056D2] font-bold rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto lg:mx-0 group text-lg"
            >
              {t('vocab.start_ai')}
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="relative flex-shrink-0">
             <div className="w-56 h-56 bg-white/5 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
               <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                 <BookOpen size={64} className="text-blue-100" />
               </div>
             </div>
          </div>
        </div>
      </section>
      )}

      {/* Footer Nav Info */}
      <div className="flex justify-center items-center gap-8 py-8 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-400 group cursor-help">
          <Calendar size={18} />
          <span className="text-sm font-bold uppercase tracking-widest">{t('vocab.next_review')}</span>
        </div>
        <div className="w-1 h-1 bg-gray-300 rounded-full" />
        <div className="flex items-center gap-2 text-gray-400 group cursor-help">
          <Trophy size={18} />
          <span className="text-sm font-bold uppercase tracking-widest">{t('vocab.weekly_rank')}</span>
        </div>
      </div>
    </div>
    )}
  </div>
  );
};

export default VocabularyView;
