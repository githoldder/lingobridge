import { apiFetch } from './apiClient.ts';

interface TranslateResult {
  translatedText: string;
  provider: string;
  from: string;
  to: string;
}

const translationCache = new Map<string, string>();

function cacheKey(text: string, from: string, to: string) {
  return `${from}:${to}:${text.trim()}`;
}

export async function translateText(
  text: string,
  from: string = 'zh',
  to: string = 'ru'
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const key = cacheKey(trimmed, from, to);
  const cached = translationCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const result = await apiFetch<TranslateResult>('/translate', {
      method: 'POST',
      body: JSON.stringify({ text: trimmed, from, to }),
    });
    const translated = result.translatedText || '';
    translationCache.set(key, translated);
    return translated;
  } catch {
    translationCache.set(key, '');
    return '';
  }
}

export async function translateBatch(
  texts: string[],
  from: string = 'zh',
  to: string = 'ru'
): Promise<string[]> {
  const normalized = texts.map((text) => text.trim());
  const results = normalized.map((text) => translationCache.get(cacheKey(text, from, to)));
  const missing = normalized
    .map((text, index) => ({ text, index }))
    .filter((item) => item.text && results[item.index] === undefined);

  if (missing.length === 0) return results.map((item) => item || '');

  try {
    const result = await apiFetch<{ translations: string[] }>('/translate/batch', {
      method: 'POST',
      body: JSON.stringify({ texts: missing.map((item) => item.text), from, to }),
    });
    missing.forEach((item, i) => {
      const translated = result.translations[i] || '';
      translationCache.set(cacheKey(item.text, from, to), translated);
      results[item.index] = translated;
    });
    return results.map((item) => item || '');
  } catch {
    missing.forEach((item) => translationCache.set(cacheKey(item.text, from, to), ''));
    return normalized.map(() => '');
  }
}
