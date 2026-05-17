import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { TTSProvider, TTSRequest, TTSResponse, TTSUsageRecord } from './tts.ts';

const AZURE_TTS_URL = 'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1';
const STORAGE_DIR = path.resolve(process.cwd(), 'backend/data/tts-cache');
const USAGE_FILE = path.resolve(process.cwd(), 'backend/data/tts-usage.json');

interface AzureConfig {
  key: string;
  region: string;
  tier: 'F0' | 'S0';
}

function getConfig(): AzureConfig | null {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  const tier = (process.env.AZURE_SPEECH_TIER as 'F0' | 'S0') || 'F0';
  if (!key || !region) return null;
  return { key, region, tier };
}

function getCacheKey(req: TTSRequest): string {
  const hash = crypto.createHash('md5')
    .update(`${req.lang}:${req.voice || 'default'}:${req.speed || '100'}:${req.text}`)
    .digest('hex');
  return `tts:${hash}.mp3`;
}

function getCachedPath(cacheKey: string): string | null {
  const filePath = path.join(STORAGE_DIR, cacheKey);
  if (fs.existsSync(filePath)) return filePath;
  return null;
}

function saveToCache(cacheKey: string, audioBuffer: Buffer): string {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
  const filePath = path.join(STORAGE_DIR, cacheKey);
  fs.writeFileSync(filePath, audioBuffer);
  return filePath;
}

function loadUsageLog(): TTSUsageRecord[] {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8')) as TTSUsageRecord[];
    }
  } catch (e) {
    console.error('Failed to load TTS usage log:', e);
  }
  return [];
}

function saveUsageLog(log: TTSUsageRecord[]) {
  try {
    if (!fs.existsSync(path.dirname(USAGE_FILE))) {
      fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
    }
    fs.writeFileSync(USAGE_FILE, JSON.stringify(log, null, 2));
  } catch (e) {
    console.error('Failed to save TTS usage log:', e);
  }
}

export class AzureSpeechProvider implements TTSProvider {
  name = 'azure-speech';
  private usageLog: TTSUsageRecord[];
  private config: AzureConfig | null;
  private healthCheckCache: { status: boolean; timestamp: number } | null = null;

  constructor() {
    this.config = getConfig();
    this.usageLog = loadUsageLog();
  }

  private persistUsage() {
    saveUsageLog(this.usageLog);
  }

  async synthesize(req: TTSRequest): Promise<TTSResponse> {
    const start = Date.now();
    const charCount = req.text.length;
    const billingChars = req.lang.startsWith('zh') ? charCount * 2 : charCount;

    if (!this.config) {
      return this.fallback(req, charCount, billingChars, start);
    }

    const cacheKey = getCacheKey(req);
    const cachedPath = getCachedPath(cacheKey);
    if (cachedPath) {
      const latencyMs = Date.now() - start;
      const record: TTSUsageRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        provider: this.name,
        text: '[cached]',
        lang: req.lang,
        charCount,
        billingChars,
        cached: true,
        latencyMs,
        costUsd: 0
      };
      this.usageLog.push(record);
      this.persistUsage();
      return {
        audioUrl: `/uploads/tts-cache/${cacheKey}`,
        provider: this.name,
        cached: true,
        charCount,
        billingChars,
        latencyMs
      };
    }

    const used = await this.getMonthlyBillingChars();
    if (used + billingChars > this.getMonthlyCharLimit()) {
      return this.fallback(req, charCount, billingChars, start);
    }

    try {
      const url = AZURE_TTS_URL.replace('{region}', this.config.region);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
        },
        body: this.buildSSML(req)
      });

      if (!response.ok) {
        throw new Error(`Azure TTS failed: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      saveToCache(cacheKey, audioBuffer);
      const latencyMs = Date.now() - start;
      const costUsd = this.config.tier === 'F0' ? 0 : (billingChars / 1_000_000) * 15;

      const record: TTSUsageRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        provider: this.name,
        text: req.text.slice(0, 50),
        lang: req.lang,
        charCount,
        billingChars,
        cached: false,
        latencyMs,
        costUsd
      };
      this.usageLog.push(record);
      this.persistUsage();

      return {
        audioUrl: `/uploads/tts-cache/${cacheKey}`,
        provider: this.name,
        cached: false,
        charCount,
        billingChars,
        latencyMs
      };
    } catch (error) {
      console.error('Azure TTS error:', error);
      return this.fallback(req, charCount, billingChars, start);
    }
  }

  private fallback(req: TTSRequest, charCount: number, billingChars: number, start: number): TTSResponse {
    const latencyMs = Date.now() - start;
    const record: TTSUsageRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      provider: 'browser-fallback',
      text: '[fallback]',
      lang: req.lang,
      charCount,
      billingChars,
      cached: false,
      latencyMs,
      costUsd: 0
    };
    this.usageLog.push(record);
    this.persistUsage();

    return {
      audioUrl: null,
      provider: 'browser-fallback',
      cached: false,
      charCount,
      billingChars,
      latencyMs
    };
  }

  private buildSSML(req: TTSRequest): string {
    const voice = req.voice || (req.lang.startsWith('zh') ? 'zh-CN-XiaoxiaoNeural' : 'en-US-JennyNeural');
    const speed = req.speed ? ` rate="${req.speed}%"` : '';
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${req.lang}">
      <voice name="${voice}">
        <prosody${speed}>${this.escapeXml(req.text)}</prosody>
      </voice>
    </speak>`;
  }

  private escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  async getUsage(startDate?: string, endDate?: string): Promise<TTSUsageRecord[]> {
    return this.usageLog.filter(r => {
      if (startDate && r.timestamp < startDate) return false;
      if (endDate && r.timestamp > endDate) return false;
      return true;
    });
  }

  async isHealthy(): Promise<boolean> {
    if (!this.config) return false;

    const now = Date.now();
    if (this.healthCheckCache && now - this.healthCheckCache.timestamp < 60_000) {
      return this.healthCheckCache.status;
    }

    const valid = this.config.key.length > 0 && this.config.region.length > 0;
    this.healthCheckCache = { status: valid, timestamp: now };
    return valid;
  }

  async getMonthlyBillingChars(): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const records = await this.getUsage(monthStart);
    return records.filter(r => r.provider === this.name && !r.cached).reduce((sum, r) => sum + r.billingChars, 0);
  }

  getMonthlyCharLimit(): number {
    return this.config?.tier === 'F0' ? 500_000 : Infinity;
  }

  async isOverLimit(): Promise<boolean> {
    const used = await this.getMonthlyBillingChars();
    return used >= this.getMonthlyCharLimit();
  }
}
