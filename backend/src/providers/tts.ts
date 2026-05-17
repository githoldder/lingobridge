export interface TTSRequest {
  text: string;
  lang: string;
  voice?: string;
  speed?: number;
}

export interface TTSResponse {
  audioUrl: string | null;
  provider: string;
  cached: boolean;
  charCount: number;
  billingChars: number;
  latencyMs: number;
}

export interface TTSUsageRecord {
  id: string;
  timestamp: string;
  provider: string;
  text: string;
  lang: string;
  charCount: number;
  billingChars: number;
  cached: boolean;
  latencyMs: number;
  costUsd: number;
}

export interface TTSProvider {
  name: string;
  synthesize(req: TTSRequest): Promise<TTSResponse>;
  getUsage(startDate?: string, endDate?: string): Promise<TTSUsageRecord[]>;
  isHealthy(): Promise<boolean>;
  getMonthlyBillingChars(): Promise<number>;
  getMonthlyCharLimit(): number;
  isOverLimit(): Promise<boolean>;
}
