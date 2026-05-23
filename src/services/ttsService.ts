/**
 * TTS Service for high-quality speech synthesis.
 * In a production environment, this can be extended to call 
 * dedicated servers running CosyVoice, GPT-SoVITS, or ChatTTS.
 */

import { ttsApi, mediaUrl } from './apiClient.ts';

const TTS_CACHE_NAME = 'lingobridge-tts-cache-v1';
const TTS_INDEX_KEY = 'lingobridge_tts_cache_index_v1';

function ttsCacheKey(text: string, lang: string, voice?: string, speed?: number) {
  return `${lang}:${voice || 'default'}:${speed || 'default'}:${text}`.slice(0, 512);
}

function readTtsIndex(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(TTS_INDEX_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeTtsIndex(index: Record<string, string>) {
  try {
    localStorage.setItem(TTS_INDEX_KEY, JSON.stringify(index));
  } catch {
    // Cache index is opportunistic; playback still falls back to browser TTS.
  }
}

class TTSService {
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.loadVoices();
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined') {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  /**
   * Prioritizes high-quality Chinese voices.
   * Order: Google/Microsoft Online Voices -> Local High Quality -> System Default
   */
  private getBestVoice(lang: string): SpeechSynthesisVoice | null {
    // List of preferred premium keywords for natural TTS
    const premiumKeywords = ['Google', 'Microsoft', 'Natural', 'Premium', 'Hi-Fi'];
    
    // 1. Try to find a premium voice for the target lang
    for (const keyword of premiumKeywords) {
      const voice = this.voices.find(v => 
        (v.lang === lang || v.lang.startsWith(lang.split('-')[0])) && 
        v.name.includes(keyword)
      );
      if (voice) return voice;
    }

    // 2. Fallback to any voice for this lang
    return this.voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0])) || null;
  }

  /**
   * Speaks the text. 
   * @param text The string to speak
   * @param lang Language code (e.g., 'zh-CN', 'ru-RU')
   */
  public async speak(text: string, lang: 'zh-CN' | 'ru-RU' = 'zh-CN', voice?: string, speed?: number) {
    if (typeof window === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const key = ttsCacheKey(text, lang, voice, speed);
    const index = readTtsIndex();
    if ('caches' in window && index[key]) {
      try {
        const cache = await caches.open(TTS_CACHE_NAME);
        const cached = await cache.match(index[key]);
        if (cached) {
          const blob = await cached.blob();
          const objectUrl = URL.createObjectURL(blob);
          const audio = new Audio(objectUrl);
          audio.onended = () => URL.revokeObjectURL(objectUrl);
          audio.onerror = () => URL.revokeObjectURL(objectUrl);
          await audio.play();
          return;
        }
      } catch (error) {
        console.warn('TTS browser cache unavailable, falling back to backend/browser.', error);
      }
    }

    try {
      const result = await ttsApi.synthesize(text, lang, voice, speed);
      if (result.audioUrl) {
        const url = mediaUrl(result.audioUrl);
        if ('caches' in window) {
          try {
            const cache = await caches.open(TTS_CACHE_NAME);
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response.clone());
              index[key] = url;
              writeTtsIndex(index);
            }
          } catch (error) {
            console.warn('Unable to persist TTS audio in browser cache.', error);
          }
        }
        const audio = new Audio(url);
        await audio.play();
        return;
      }
    } catch (error) {
      console.warn('TTS backend unavailable, using browser fallback.', error);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const browserVoice = this.getBestVoice(lang);
    
    if (browserVoice) {
      utterance.voice = browserVoice;
    }

    utterance.lang = lang;
    utterance.rate = lang.startsWith('zh') ? 0.9 : 0.85; // Natural pacing for Chinese
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }
}

export const ttsService = new TTSService();
