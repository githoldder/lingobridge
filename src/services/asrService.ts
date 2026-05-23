type AsrCallback = (text: string, isFinal: boolean) => void;

interface AsrState {
  recognition: any;
  isListening: boolean;
  onResult: AsrCallback | null;
  onError: ((err: string) => void) | null;
  lang: string;
}

const state: AsrState = {
  recognition: null,
  isListening: false,
  onResult: null,
  onError: null,
  lang: 'zh-CN',
};

function getSpeechRecognition(): any {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isAsrSupported(): boolean {
  return !!getSpeechRecognition();
}

export function startAsr(
  lang: string,
  onResult: AsrCallback,
  onError?: (err: string) => void
): boolean {
  const SR = getSpeechRecognition();
  if (!SR) {
    onError?.('Web Speech API not supported');
    return false;
  }

  stopAsr();

  const recognition = new SR();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    if (finalTranscript) {
      state.onResult?.(finalTranscript.trim(), true);
    } else if (interimTranscript) {
      state.onResult?.(interimTranscript.trim(), false);
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    state.onError?.(event.error);
  };

  recognition.onend = () => {
    if (state.isListening && state.recognition === recognition) {
      try { recognition.start(); } catch {}
    }
  };

  state.recognition = recognition;
  state.isListening = true;
  state.onResult = onResult;
  state.onError = onError || null;
  state.lang = lang;

  try {
    recognition.start();
    return true;
  } catch (e: any) {
    state.isListening = false;
    onError?.(e.message || 'Failed to start ASR');
    return false;
  }
}

export function stopAsr(): void {
  state.isListening = false;
  if (state.recognition) {
    try { state.recognition.stop(); } catch {}
    state.recognition = null;
  }
  state.onResult = null;
  state.onError = null;
}

export function isAsrListening(): boolean {
  return state.isListening;
}

const DEMO_SUBTITLES: { zh: string; ru: string }[] = [
  { zh: '你好，欢迎来到中文课堂', ru: 'Здравствуйте, добро пожаловать на урок китайского языка' },
  { zh: '今天我们学习基本的问候语', ru: 'Сегодня мы изучим основные приветствия' },
  { zh: '请跟我读：你好', ru: 'Пожалуйста, повторяйте за мной: Нихао' },
  { zh: '很好，你的发音非常准确', ru: 'Отлично, ваше произношение очень точное' },
  { zh: '下面我们练习一下对话', ru: 'Теперь давайте попрактикуем диалог' },
  { zh: '你叫什么名字？', ru: 'Как тебя зовут?' },
  { zh: '我叫老师，很高兴认识你', ru: 'Меня зовут учитель, рад познакомиться' },
  { zh: '今天的课就到这里', ru: 'На сегодня урок окончен' },
];

let demoIdx = 0;
let demoTimer: ReturnType<typeof setInterval> | null = null;

export function startDemoSubtitles(
  onSubtitle: (line: { zh: string; ru: string }) => void,
  intervalMs = 4000
): void {
  stopDemoSubtitles();
  demoIdx = 0;
  onSubtitle(DEMO_SUBTITLES[demoIdx]);
  demoIdx++;
  demoTimer = setInterval(() => {
    if (demoIdx < DEMO_SUBTITLES.length) {
      onSubtitle(DEMO_SUBTITLES[demoIdx]);
      demoIdx++;
    } else {
      stopDemoSubtitles();
    }
  }, intervalMs);
}

export function stopDemoSubtitles(): void {
  if (demoTimer) {
    clearInterval(demoTimer);
    demoTimer = null;
  }
}
