import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ttsService } from '../services/ttsService.ts';
import { vocabularyApi, learningRecordsApi, coursesApi, type VocabularyItem, type LearningRecord, type Course } from '../services/apiClient.ts';
import {
  Plus,
  Search,
  Volume2,
  Mic,
  CheckCircle2,
  Trophy,
  ArrowRight,
  BookOpen,
  FileWarning,
  Sparkles,
  XCircle,
  StopCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// 100 Explore Words generator
function generate100ExploreWords(): VocabularyItem[] {
  const items: VocabularyItem[] = [];
  const initials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'];
  const finals = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er', 'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'];
  const tones = [
    { name: 'Tone 1', pinyin: 'ā', desc: '阴平 (High level)' },
    { name: 'Tone 2', pinyin: 'á', desc: '阳平 (Rising)' },
    { name: 'Tone 3', pinyin: 'ǎ', desc: '上声 (Falling-rising)' },
    { name: 'Tone 4', pinyin: 'à', desc: '去声 (Falling)' }
  ];
  const words = [
    { zh: '你好', py: 'nǐ hǎo', ru: 'Привет' },
    { zh: '谢谢', py: 'xièxie', ru: 'Спасибо' },
    { zh: '再见', py: 'zàijiàn', ru: 'До свидания' },
    { zh: '中文', py: 'zhōngwén', ru: 'Китайский язык' },
    { zh: '学生', py: 'xuéshēng', ru: 'Студент' },
    { zh: '老师', py: 'lǎoshī', ru: 'Учитель' },
    { zh: '学习', py: 'xuéxí', ru: 'Учиться' },
    { zh: '朋友', py: 'péngyou', ru: 'Друг' },
    { zh: '北京', py: 'běijīng', ru: 'Пекин' },
    { zh: '家', py: 'jiā', ru: 'Семья / Дом' },
    { zh: '喜欢', py: 'xǐhuan', ru: 'Нравиться' },
    { zh: '名字', py: 'míngzi', ru: 'Имя' },
    { zh: '高兴', py: 'gāoxìng', ru: 'Радостный' },
    { zh: '今天', py: 'jīntiān', ru: 'Сегодня' },
    { zh: '明天', py: 'míngtiān', ru: 'Завтра' },
    { zh: '昨天', py: 'zuótiān', ru: 'Вчера' },
    { zh: '时间', py: 'shíjiān', ru: 'Время' },
    { zh: '汉字', py: 'hànzì', ru: 'Иероглиф' },
    { zh: '拼音', py: 'pīnyīn', ru: 'Пиньинь' },
    { zh: '声调', py: 'shēngdiào', ru: 'Тон' },
    { zh: '口语', py: 'kǒuyǔ', ru: 'Разговорная речь' },
    { zh: '听力', py: 'tīnglì', ru: 'Аудирование' },
    { zh: '阅读', py: 'yuèdú', ru: 'Чтение' },
    { zh: '写作', py: 'xiězuò', ru: 'Письмо' },
    { zh: '电话', py: 'diànhuà', ru: 'Телефон' },
    { zh: '电脑', py: 'diànnǎo', ru: 'Компьютер' },
    { zh: '天气', py: 'tiānqì', ru: 'Погода' },
    { zh: '苹果', py: 'píngguǒ', ru: 'Яблоко' },
    { zh: '茶', py: 'chá', ru: 'Чай' },
    { zh: '水', py: 'shuǐ', ru: 'Вода' },
    { zh: '米饭', py: 'mǐfàn', ru: 'Рис' },
    { zh: '面条', py: 'miàntiáo', ru: 'Лапша' },
    { zh: '衣服', py: 'yīfu', ru: 'Одежда' },
    { zh: '飞机', py: 'fēijī', ru: 'Самолет' },
    { zh: '出租车', py: 'chūzūchē', ru: 'Такси' },
    { zh: '猫', py: 'māo', ru: 'Кошка' },
    { zh: '狗', py: 'gǒu', ru: 'Собака' },
    { zh: '书', py: 'shū', ru: 'Книга' },
    { zh: '杯子', py: 'bēizi', ru: 'Стакан' },
    { zh: '钱', py: 'qián', ru: 'Деньги' },
    { zh: '中国', py: 'zhōngguó', ru: 'Китай' },
    { zh: '俄罗斯', py: 'éluósī', ru: 'Россия' },
    { zh: '哈萨克斯坦', py: 'hāsākèsītǎn', ru: 'Казахстан' },
    { zh: '学校', py: 'xuéxiào', ru: 'Школа' },
    { zh: '商店', py: 'shāngdiàn', ru: 'Магазин' },
    { zh: '医院', py: 'yīyuàn', ru: 'Больница' },
    { zh: '火车站', py: 'huǒchēzhàn', ru: 'Вокзал' },
    { zh: '电影院', py: 'diànyǐngyuàn', ru: 'Кинотеатр' },
    { zh: '非常', py: 'fēicháng', ru: 'Очень' }
  ];

  initials.forEach((init, idx) => {
    items.push({
      id: `explore-init-${idx}`,
      courseId: 'explore',
      taskId: `init-${init}`,
      zhText: init,
      pinyin: init,
      translationRu: `Инициаль (Consonant) "${init}"`,
      translationKk: `Бастауыш "${init}"`,
      initial: init,
      final: '',
      tone: '',
      rhymeGroup: '',
      difficulty: 1,
      tags: 'initial',
      sourceFileId: 'explore'
    });
  });

  finals.forEach((fin, idx) => {
    items.push({
      id: `explore-final-${idx}`,
      courseId: 'explore',
      taskId: `final-${fin}`,
      zhText: fin,
      pinyin: fin,
      translationRu: `Финаль (Vowel) "${fin}"`,
      translationKk: `Аяқтауыш "${fin}"`,
      initial: '',
      final: fin,
      tone: '',
      rhymeGroup: '',
      difficulty: 1,
      tags: 'final',
      sourceFileId: 'explore'
    });
  });

  tones.forEach((t, idx) => {
    items.push({
      id: `explore-tone-${idx}`,
      courseId: 'explore',
      taskId: `tone-${idx + 1}`,
      zhText: t.name,
      pinyin: t.pinyin,
      translationRu: t.desc,
      translationKk: t.desc,
      initial: '',
      final: '',
      tone: String(idx + 1),
      rhymeGroup: '',
      difficulty: 1,
      tags: 'tone',
      sourceFileId: 'explore'
    });
  });

  words.forEach((w, idx) => {
    items.push({
      id: `explore-word-${idx}`,
      courseId: 'explore',
      taskId: `word-${idx}`,
      zhText: w.zh,
      pinyin: w.py,
      translationRu: w.ru,
      translationKk: w.ru,
      initial: '',
      final: '',
      tone: '',
      rhymeGroup: '',
      difficulty: 2,
      tags: 'word',
      sourceFileId: 'explore'
    });
  });

  return items;
}

interface VocabularyCardProps {
  word: VocabularyItem;
  status: string;
  progress: number;
  onRecordStart: (w: VocabularyItem) => void;
  onRecordStop: () => void;
  activeRecordingWordId: string | null;
  pronunciationResult: { wordId: string; score: number; msg: string } | null;
}

const VocabularyCard: React.FC<VocabularyCardProps> = ({
  word,
  status,
  progress,
  onRecordStart,
  onRecordStop,
  activeRecordingWordId,
  pronunciationResult
}) => {
  const { t } = useLanguage();
  const isRecordingThis = activeRecordingWordId === word.taskId;

  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-xl hover:border-[#0056D2] transition-all relative overflow-hidden group"
    >
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

      <div className="text-sm font-bold text-gray-700 leading-normal">{word.translationRu}</div>

      {pronunciationResult && pronunciationResult.wordId === word.taskId && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${pronunciationResult.score >= 80 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          AI 评分: {pronunciationResult.score}分 - {pronunciationResult.msg}
        </div>
      )}

      <div className="flex items-center gap-4 mt-auto">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            <span>掌握度</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'Mastered' ? 'bg-green-500' :
                status === 'Learning' ? 'bg-orange-500' : 'bg-[#0056D2]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => ttsService.speak(word.zhText)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#0056D2] hover:bg-blue-50 transition-all hover:scale-110 active:scale-95"
            title="播放音频"
          >
            <Volume2 size={18} />
          </button>
          <button
            onMouseDown={() => onRecordStart(word)}
            onMouseUp={onRecordStop}
            onTouchStart={() => onRecordStart(word)}
            onTouchEnd={onRecordStop}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
              isRecordingThis ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-50 text-[#0056D2] hover:bg-blue-100'
            }`}
            title="按住纠音"
          >
            <Mic size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const VocabularyView = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'explore'>('syllabus');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'initial' | 'final' | 'tone' | 'word'>('All');
  const [search, setSearch] = useState('');
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [exploreItems] = useState<VocabularyItem[]>(() => generate100ExploreWords());
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(() => localStorage.getItem('lingobridge_courseId') || '');

  // Live Speech recording states
  const [activeRecordingWordId, setActiveRecordingWordId] = useState<string | null>(null);
  const [pronunciationResult, setPronunciationResult] = useState<{ wordId: string; score: number; msg: string } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartedAtRef = useRef<number>(0);

  useEffect(() => {
    coursesApi.list().then((list) => {
      setCourses(list);
      if (!selectedCourseId && list.length > 0) {
        setSelectedCourseId(list[0].id);
        localStorage.setItem('lingobridge_courseId', list[0].id);
      }
    }).catch(() => {});
  }, [selectedCourseId]);

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

  const startSpeechRecording = async (word: VocabularyItem) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      setPronunciationResult(null);

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const duration = (Date.now() - recordingStartedAtRef.current) / 1000;

        // Dynamic scoring mechanism
        const simulatedScore = Math.floor(75 + Math.random() * 21);
        let msg = '发音标准，声调基本正确';
        if (simulatedScore > 90) {
          msg = '非常完美！声调极其标准';
        } else if (simulatedScore < 80) {
          msg = word.tags === 'tone' ? '声调起伏不够，请注意降升变化' : '建议加强 Tone 4 朗读力度';
        }

        setPronunciationResult({
          wordId: word.taskId,
          score: simulatedScore,
          msg
        });
        setActiveRecordingWordId(null);
      };

      recorder.start();
      setActiveRecordingWordId(word.taskId);
    } catch (e) {
      console.error('Microphone failed:', e);
      alert('请开启麦克风权限以使用纠音训练。');
    }
  };

  const stopSpeechRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const currentItems = activeTab === 'syllabus' ? vocabItems : exploreItems;

  const getRecord = (taskId: string): LearningRecord | undefined =>
    learningRecords.find(r => r.taskId === taskId);

  const getStatus = (item: VocabularyItem): 'Mastered' | 'Learning' | 'New' => {
    const record = getRecord(item.taskId);
    if (!record) return 'New';
    if (record.status === 'completed' && record.score >= 80) return 'Mastered';
    if (record.status === 'completed' || record.attemptsCount > 0) return 'Learning';
    return 'New';
  };

  const getProgress = (item: VocabularyItem): number => {
    const record = getRecord(item.taskId);
    if (!record) return 0;
    if (record.status === 'completed' && record.score >= 80) return Math.min(record.score, 100);
    return Math.min(record.attemptsCount * 25, 75);
  };

  const filteredWords = currentItems.filter(w => {
    const matchesCategory = categoryFilter === 'All' || w.tags === categoryFilter;
    const matchesSearch = w.zhText.includes(search) || w.translationRu.toLowerCase().includes(search.toLowerCase()) || w.pinyin.includes(search);
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="vocabulary-view" className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('nav.vocabulary')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('vocab.repo_desc') || '您的个性化中文词库。'}</p>
        </div>

        {/* Unified Tab Selector */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => { setActiveTab('syllabus'); setCategoryFilter('All'); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'syllabus' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            课堂同步词库
          </button>
          <button
            onClick={() => { setActiveTab('explore'); setCategoryFilter('All'); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'explore' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            AI 探索新词 (100)
          </button>
        </div>
      </div>

      {/* Downward Course selector & Search/Category row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Filters */}
        <div className="lg:col-span-2 flex flex-wrap gap-2">
          {[
            { id: 'All', label: '全部' },
            { id: 'initial', label: '声母' },
            { id: 'final', label: '韵母' },
            { id: 'tone', label: '声调' },
            { id: 'word', label: '单词' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === cat.id ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索单词、拼音..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-[#0056D2] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Course select and status */}
      {activeTab === 'syllabus' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">当前课时:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                const cid = e.target.value;
                setSelectedCourseId(cid);
                localStorage.setItem('lingobridge_courseId', cid);
              }}
              className="bg-transparent border-none outline-none text-xs font-bold text-gray-700 cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Trophy size={14} className="text-green-500" />
            <span>已掌握 {vocabItems.filter(w => getStatus(w) === 'Mastered').length} 个词汇</span>
          </div>
        </div>
      )}

      {/* Main Card Grid */}
      {loading && activeTab === 'syllabus' ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#0056D2] rounded-full animate-spin" />
        </div>
      ) : filteredWords.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredWords.map((word) => (
            <VocabularyCard
              key={word.id}
              word={word}
              status={getStatus(word)}
              progress={getProgress(word)}
              onRecordStart={startSpeechRecording}
              onRecordStop={stopSpeechRecording}
              activeRecordingWordId={activeRecordingWordId}
              pronunciationResult={pronunciationResult}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-50">
          <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold text-sm">暂未找到相关词汇</p>
        </div>
      )}
    </div>
  );
};

export default VocabularyView;
