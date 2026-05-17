import crypto from 'node:crypto';
import type { TTSProvider, TTSRequest, TTSResponse, TTSUsageRecord } from './tts.ts';

export class BrowserFallbackProvider implements TTSProvider {
  name = 'browser-fallback';
  private usageLog: TTSUsageRecord[] = [];

  async synthesize(req: TTSRequest): Promise<TTSResponse> {
    const start = Date.now();
    const charCount = req.text.length;
    const billingChars = req.lang.startsWith('zh') ? charCount * 2 : charCount;

    const record: TTSUsageRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      provider: this.name,
      text: req.text.slice(0, 100),
      lang: req.lang,
      charCount,
      billingChars,
      cached: false,
      latencyMs: Date.now() - start,
      costUsd: 0
    };
    this.usageLog.push(record);

    return {
      audioUrl: null,
      provider: this.name,
      cached: false,
      charCount,
      billingChars,
      latencyMs: record.latencyMs
    };
  }

  async getUsage(startDate?: string, endDate?: string): Promise<TTSUsageRecord[]> {
    return this.usageLog.filter(r => {
      if (startDate && r.timestamp < startDate) return false;
      if (endDate && r.timestamp > endDate) return false;
      return true;
    });
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async getMonthlyBillingChars(): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const records = await this.getUsage(monthStart);
    return records.reduce((sum, r) => sum + r.billingChars, 0);
  }

  getMonthlyCharLimit(): number {
    return Infinity;
  }

  async isOverLimit(): Promise<boolean> {
    return false;
  }
}
