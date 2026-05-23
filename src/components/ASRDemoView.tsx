import React, { useState, useCallback, useRef, useEffect } from 'react';

interface DemoTranslation {
  ru: string;
  kk: string;
  en: string;
}

interface DemoSentence {
  zhText: string;
  pinyin: string;
  translation: DemoTranslation;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  sentences: DemoSentence[];
}

const SCENARIOS: DemoScenario[] = [
  {
    id: 'intro',
    title: '自我介绍',
    description: 'Basic self-introduction in a classroom setting',
    sentences: [
      { zhText: '同学们好，欢迎来到中文课堂。', pinyin: 'Tóngxuémen hǎo, huānyíng lái dào zhōngwén kètáng.', translation: { ru: 'Здравствуйте, ученики! Добро пожаловать на урок китайского языка.', kk: 'Оқушылар, сәлеметсіздер ме! Қытай тілі сабағына қош келдіңіздер.', en: 'Hello students, welcome to Chinese class.' } },
      { zhText: '今天我们来学习新的单词和句子。', pinyin: 'Jīntiān wǒmen lái xuéxí xīn de dāncí hé jùzi.', translation: { ru: 'Сегодня мы будем учить новые слова и предложения.', kk: 'Бүгін біз жаңа сөздер мен сөйлемдерді үйренеміз.', en: "Today we'll learn new words and sentences." } },
      { zhText: '我叫安娜，我是俄罗斯人。', pinyin: 'Wǒ jiào ānnà, wǒ shì èluósī rén.', translation: { ru: 'Меня зовут Анна, я из России.', kk: 'Менің атым Анна, мен Ресейденмін.', en: 'My name is Anna, I am from Russia.' } },
      { zhText: '我喜欢学习中文。', pinyin: 'Wǒ xǐhuān xuéxí zhōngwén.', translation: { ru: 'Я люблю учить китайский язык.', kk: 'Мен қытай тілін үйренгенді ұнатамын.', en: 'I like learning Chinese.' } },
      { zhText: '中文很有意思，但是也很难。', pinyin: 'Zhōngwén hěn yǒuyìsi, dànshì yě hěn nán.', translation: { ru: 'Китайский язык очень интересный, но и очень сложный.', kk: 'Қытай тілі өте қызықты, бірақ өте қиын.', en: 'Chinese is very interesting, but also very difficult.' } },
    ],
  },
  {
    id: 'daily',
    title: '日常用语',
    description: 'Common daily expressions',
    sentences: [
      { zhText: '你好', pinyin: 'Nǐ hǎo', translation: { ru: 'Здравствуйте', kk: 'Сәлеметсіз бе', en: 'Hello' } },
      { zhText: '谢谢', pinyin: 'Xièxiè', translation: { ru: 'Спасибо', kk: 'Рахмет', en: 'Thank you' } },
      { zhText: '对不起', pinyin: 'Duìbuqǐ', translation: { ru: 'Извините', kk: 'Кешіріңіз', en: 'Sorry' } },
      { zhText: '没关系', pinyin: 'Méiguānxì', translation: { ru: 'Ничего страшного', kk: 'Ештеңе етпейді', en: "It's okay" } },
      { zhText: '请问，这个多少钱？', pinyin: 'Qǐngwèn, zhège duōshao qián?', translation: { ru: 'Скажите, пожалуйста, сколько это стоит?', kk: 'Мынау қанша тұрады?', en: 'Excuse me, how much is this?' } },
    ],
  },
  {
    id: 'classroom',
    title: '课堂用语',
    description: 'Common classroom phrases for teachers and students',
    sentences: [
      { zhText: '请跟我读。', pinyin: 'Qǐng gēn wǒ dú.', translation: { ru: 'Пожалуйста, повторяйте за мной.', kk: 'Маған ілесіп оқыңыз.', en: 'Please repeat after me.' } },
      { zhText: '大家一起来读。', pinyin: 'Dàjiā yìqǐ lái dú.', translation: { ru: 'Давайте все вместе прочитаем.', kk: 'Барлығымыз бірге оқиық.', en: 'Let\'s all read together.' } },
      { zhText: '很好！你们做得很好。', pinyin: 'Hěn hǎo! Nǐmen zuò de hěn hǎo.', translation: { ru: 'Отлично! У вас хорошо получается.', kk: 'Өте жақсы! Сендердің істегендерің өте жақсы.', en: 'Very good! You are doing great.' } },
      { zhText: '有问题吗？', pinyin: 'Yǒu wèntí ma?', translation: { ru: 'Есть вопросы?', kk: 'Сұрақтарыңыз бар ма?', en: 'Any questions?' } },
    ],
  },
  {
    id: 'grammar',
    title: '基本语法',
    description: 'Basic Chinese grammar patterns',
    sentences: [
      { zhText: '我是学生，你是老师。', pinyin: 'Wǒ shì xuéshēng, nǐ shì lǎoshī.', translation: { ru: 'Я студент, ты учитель.', kk: 'Мен студентпін, сен мұғалімсің.', en: 'I am a student, you are a teacher.' } },
      { zhText: '这是我的书。', pinyin: 'Zhè shì wǒ de shū.', translation: { ru: 'Это моя книга.', kk: 'Бұл менің кітабым.', en: 'This is my book.' } },
      { zhText: '她去学校。', pinyin: 'Tā qù xuéxiào.', translation: { ru: 'Она идет в школу.', kk: 'Ол мектепке барады.', en: 'She goes to school.' } },
      { zhText: '我们一起去吃饭吧。', pinyin: 'Wǒmen yìqǐ qù chīfàn ba.', translation: { ru: 'Давайте вместе пойдем поедим.', kk: 'Бірге тамақтануға барайық.', en: 'Let\'s go eat together.' } },
    ],
  },
];

type TargetLang = 'ru' | 'kk' | 'en';
type DemoMode = 'simulated' | 'realtime';

const LANG_LABELS: Record<TargetLang, string> = { ru: 'Русский', kk: 'Қазақша', en: 'English' };

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function findBestMatch(transcript: string, sentences: DemoSentence[]): DemoSentence | null {
  let best: DemoSentence | null = null;
  let bestScore = Infinity;
  for (const s of sentences) {
    const score = levenshtein(transcript, s.zhText);
    if (score < bestScore) { bestScore = score; best = s; }
  }
  const threshold = 8;
  return bestScore <= threshold ? best : null;
}

export default function ASRDemoView() {
  const [mode, setMode] = useState<DemoMode>('simulated');
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [targetLang, setTargetLang] = useState<TargetLang>('ru');
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [displayedText, setDisplayedText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [asrStatus, setAsrStatus] = useState('');
  const [log, setLog] = useState<Array<{ zh: string; translation: string; pinyin: string }>>([]);
  const runningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const hadFatalRef = useRef(false);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  const stopSimulated = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    window.speechSynthesis.cancel();
  }, []);

  const stopRealtime = useCallback(() => {
    runningRef.current = false;
    hadFatalRef.current = false;
    setIsRunning(false);
    setAsrStatus('');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (mode === 'simulated') stopSimulated();
    else stopRealtime();
  }, [mode, stopSimulated, stopRealtime]);

  const startSimulated = useCallback(async () => {
    stopSimulated();
    await delay(100);
    runningRef.current = true;
    setIsRunning(true);
    setCurrentIndex(-1);
    setDisplayedText('');
    setShowTranslation(false);
    setLog([]);

    const sentences = scenario.sentences;
    for (let i = 0; i < sentences.length; i++) {
      if (!runningRef.current) break;
      const s = sentences[i];
      setCurrentIndex(i);
      setDisplayedText('');
      setShowTranslation(false);
      speak(s.zhText);
      const text = s.zhText;
      for (let c = 1; c <= text.length; c++) {
        if (!runningRef.current) break;
        await delay(60);
        setDisplayedText(text.slice(0, c));
      }
      if (!runningRef.current) break;
      setShowTranslation(true);
      setLog((prev) => [...prev, { zh: s.zhText, translation: s.translation[targetLang], pinyin: s.pinyin }]);
      await delay(1200);
    }
    if (runningRef.current) { setIsRunning(false); setCurrentIndex(sentences.length); }
  }, [scenario, stopSimulated, targetLang]);

  const startRealtime = useCallback(() => {
    stopRealtime();
    runningRef.current = true;
    setIsRunning(true);
    setCurrentIndex(-1);
    setDisplayedText('');
    setShowTranslation(false);
    setInterimText('');
    setLog([]);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAsrStatus('浏览器不支持 SpeechRecognition API（请使用 Chrome/Edge）');
      runningRef.current = false;
      setIsRunning(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setAsrStatus('麦克风已开启，请朗读中文句子...');
    recognition.onerror = (event: any) => {
      const terminalErrors = ['not-allowed', 'service-not-allowed', 'aborted'];
      if (terminalErrors.includes(event.error)) {
        hadFatalRef.current = true;
        runningRef.current = false;
        setIsRunning(false);
        setAsrStatus(`语音识别失败: ${event.error}`);
      } else if (event.error === 'no-speech') {
        setAsrStatus('未检测到语音');
      } else {
        setAsrStatus(`识别错误: ${event.error}`);
      }
    };
    recognition.onend = () => {
      if (runningRef.current && mode === 'realtime' && !hadFatalRef.current) {
        try { recognition.start(); } catch {
          hadFatalRef.current = true;
          runningRef.current = false;
          setIsRunning(false);
          setAsrStatus('语音识别重启失败');
        }
      } else if (!hadFatalRef.current) {
        setAsrStatus('');
      }
    };
    recognition.onresult = (event: any) => {
      if (!runningRef.current) return;
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) {
        const matched = findBestMatch(final, scenario.sentences);
        if (matched) {
          setDisplayedText(matched.zhText);
          setShowTranslation(true);
          setLog((prev) => {
            if (prev.some((e) => e.zh === matched.zhText)) return prev;
            return [...prev, { zh: matched.zhText, translation: matched.translation[targetLang], pinyin: matched.pinyin }];
          });
        }
      }
      // Show interim
      const last = event.results[event.results.length - 1];
      if (last && !last.isFinal) {
        setInterimText(last[0].transcript);
      } else {
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      hadFatalRef.current = true;
      runningRef.current = false;
      recognitionRef.current = null;
      setIsRunning(false);
      setAsrStatus(`语音识别启动失败: ${e}`);
    }
  }, [scenario, stopRealtime, targetLang, mode]);

  const start = useCallback(() => {
    if (mode === 'simulated') startSimulated();
    else startRealtime();
  }, [mode, startSimulated, startRealtime]);

  useEffect(() => {
    return () => { runningRef.current = false; hadFatalRef.current = false; window.speechSynthesis.cancel(); stopRealtime(); };
  }, []);

  const progress = scenario.sentences.length > 0
    ? Math.round((Math.max(0, currentIndex) / scenario.sentences.length) * 100)
    : 0;

  const hasASR = typeof window !== 'undefined' && (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold">LB</div>
          <span className="font-semibold text-lg">ASR + Translation Demo</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`px-2 py-0.5 rounded text-xs font-mono ${mode === 'simulated' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
            {mode === 'simulated' ? '模拟 ASR' : '实时语音识别'}
          </span>
          {isRunning && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Left panel - Controls */}
        <div className="lg:w-80 xl:w-96 p-6 border-r border-white/5 flex flex-col gap-6 bg-black/20">
          {/* Mode toggle */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => { if (!isRunning) { stop(); setMode('simulated'); } }}
                disabled={isRunning}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'simulated' ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/25' : 'bg-white/5 text-gray-400 hover:bg-white/10'} disabled:opacity-50`}
              >
                模拟 ASR
              </button>
              <button
                onClick={() => { if (!isRunning) { stop(); setMode('realtime'); } }}
                disabled={isRunning}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'realtime' ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' : 'bg-white/5 text-gray-400 hover:bg-white/10'} disabled:opacity-50`}
              >
                实时语音识别
                {!hasASR && <span className="block text-[10px] opacity-60">(Chrome/Edge)</span>}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Scenario</label>
            <select
              value={scenarioId}
              onChange={(e) => { stop(); setScenarioId(e.target.value); setLog([]); setCurrentIndex(-1); setDisplayedText(''); setShowTranslation(false); }}
              disabled={isRunning}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-800">{s.title} — {s.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Target Language</label>
            <div className="flex gap-2">
              {(Object.entries(LANG_LABELS) as [TargetLang, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTargetLang(key)}
                  disabled={isRunning}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${targetLang === key ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-white/5 text-gray-400 hover:bg-white/10'} disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            {!isRunning ? (
              <button onClick={start} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {mode === 'simulated' ? '▶ Start Demo' : '▶ 开始录音'}
              </button>
            ) : (
              <button onClick={stop} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-semibold shadow-lg shadow-red-600/30 transition-all">
                ■ {mode === 'simulated' ? 'Stop' : '停止录音'}
              </button>
            )}
          </div>

          {/* Status / Stats */}
          {asrStatus && <div className="text-xs text-green-400/80">{asrStatus}</div>}
          {log.length > 0 && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Processed: {log.length}/{scenario.sentences.length} sentences</div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Right panel - ASR Display */}
        <div className="flex-1 flex flex-col p-6 lg:p-10 gap-6 overflow-y-auto">
          {/* Waveform */}
          <div className={`flex items-end justify-center gap-1 h-16 mb-2 transition-opacity duration-500 ${isRunning ? 'opacity-100' : 'opacity-30'}`}>
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className={`w-1.5 rounded-full bg-gradient-to-t from-blue-500 to-cyan-400 ${isRunning ? 'animate-waveform' : ''}`}
                style={{ height: isRunning ? `${Math.random() * 60 + 10}%` : '20%', animationDelay: `${i * 0.05}s`, animationDuration: `${0.5 + Math.random() * 0.5}s` }}
              />
            ))}
          </div>

          {/* Current ASR output */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
              <span>{mode === 'simulated' ? '模拟 ASR 输出' : '实时 ASR 输出'}</span>
              {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            </div>

            <div className="bg-white/5 rounded-2xl p-6 lg:p-8 min-h-[200px] border border-white/5">
              {/* Simulated mode */}
              {mode === 'simulated' && currentIndex >= 0 && currentIndex < scenario.sentences.length ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-blue-400 font-mono mt-1 shrink-0">{String(currentIndex + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-2xl lg:text-3xl font-medium text-white/90 tracking-wide min-h-[2.5rem]">
                        {displayedText}
                        {isRunning && displayedText.length < scenario.sentences[currentIndex].zhText.length && <span className="animate-pulse text-cyan-400">▎</span>}
                      </p>
                      {showTranslation && <p className="text-sm text-gray-500 mt-2 font-mono">{scenario.sentences[currentIndex].pinyin}</p>}
                    </div>
                  </div>
                  <div className={`transition-all duration-700 overflow-hidden ${showTranslation ? 'max-h-40 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[10px]">↻</span>
                        Translation ({LANG_LABELS[targetLang]})
                      </div>
                      <p className="text-xl lg:text-2xl text-white/80">{scenario.sentences[currentIndex].translation[targetLang]}</p>
                    </div>
                  </div>
                </div>
              ) : mode === 'realtime' ? (
                <div className="space-y-4">
                  <p className="text-2xl lg:text-3xl font-medium text-white/90 tracking-wide min-h-[2.5rem]">
                    {displayedText || <span className="text-gray-500 text-lg">请点击"开始录音"并朗读中文句子...</span>}
                  </p>
                  {interimText && (
                    <p className="text-lg text-gray-400/60 min-h-[1.5rem]">
                      {interimText}
                      <span className="animate-pulse text-green-400">▎</span>
                    </p>
                  )}
                  {showTranslation && displayedText && (() => {
                    const matched = scenario.sentences.find((s) => s.zhText === displayedText);
                    return matched ? (
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[10px]">↻</span>
                          Translation ({LANG_LABELS[targetLang]})
                        </div>
                        <p className="text-xl lg:text-2xl text-white/80">{matched.translation[targetLang]}</p>
                        <p className="text-sm text-gray-500 mt-1 font-mono">{matched.pinyin}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600">
                  {currentIndex === scenario.sentences.length ? '✓ Demo complete' : `Select a scenario and click "${mode === 'simulated' ? 'Start Demo' : '开始录音'}"`}
                </div>
              )}
            </div>

            {/* Conversation log */}
            {log.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Transcript</div>
                <div className="space-y-2">
                  {log.map((entry, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg px-4 py-3 border border-white/5">
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-600 font-mono mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-white/90">{entry.zh}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{entry.pinyin}</p>
                          <p className="text-sm text-blue-300/80 mt-1.5">{entry.translation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-waveform {
          animation: waveform var(--duration, 0.8s) ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
