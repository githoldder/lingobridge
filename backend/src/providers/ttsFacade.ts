import type { TTSProvider, TTSRequest, TTSResponse, TTSUsageRecord } from './tts.ts';
import { BrowserFallbackProvider } from './browserFallback.ts';
import { AzureSpeechProvider } from './azureSpeech.ts';

export class TTSFacade {
  private primary: TTSProvider;
  private fallback: TTSProvider;

  constructor() {
    this.primary = new AzureSpeechProvider();
    this.fallback = new BrowserFallbackProvider();
  }

  async synthesize(req: TTSRequest): Promise<TTSResponse> {
    try {
      const result = await this.primary.synthesize(req);
      if (result.audioUrl || result.provider === 'browser-fallback') {
        return result;
      }
      console.warn('Primary TTS returned no audio, falling back');
      return this.fallback.synthesize(req);
    } catch (error) {
      console.error('Primary TTS failed, falling back:', error);
      return this.fallback.synthesize(req);
    }
  }

  async getUsage(startDate?: string, endDate?: string): Promise<TTSUsageRecord[]> {
    const [primaryUsage, fallbackUsage] = await Promise.all([
      this.primary.getUsage(startDate, endDate),
      this.fallback.getUsage(startDate, endDate)
    ]);
    return [...primaryUsage, ...fallbackUsage].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async isHealthy(): Promise<boolean> {
    return this.primary.isHealthy();
  }

  async getProviderStatus(): Promise<{ primary: string; fallback: string; overLimit: boolean }> {
    const [primaryHealthy, overLimit] = await Promise.all([
      this.primary.isHealthy(),
      this.primary.isOverLimit()
    ]);
    return {
      primary: primaryHealthy ? 'healthy' : 'unhealthy',
      fallback: 'healthy',
      overLimit
    };
  }
}

export const ttsFacade = new TTSFacade();
