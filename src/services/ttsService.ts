/**
 * TTS Service for high-quality speech synthesis.
 * In a production environment, this can be extended to call 
 * dedicated servers running CosyVoice, GPT-SoVITS, or ChatTTS.
 */

import { ttsApi, mediaUrl } from './apiClient.ts';

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
  public async speak(text: string, lang: 'zh-CN' | 'ru-RU' = 'zh-CN') {
    if (typeof window === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    try {
      const result = await ttsApi.synthesize(text, lang);
      if (result.audioUrl) {
        const audio = new Audio(mediaUrl(result.audioUrl));
        await audio.play();
        return;
      }
    } catch (error) {
      console.warn('TTS backend unavailable, using browser fallback.', error);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getBestVoice(lang);
    
    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = lang;
    utterance.rate = lang.startsWith('zh') ? 0.9 : 0.85; // Natural pacing for Chinese
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }
}

export const ttsService = new TTSService();
