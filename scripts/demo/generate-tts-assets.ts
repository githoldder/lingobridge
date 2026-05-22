/**
 * SD-T02: Generate demo TTS MP3 assets for LingoBridge 上台演示.
 *
 * Reads scripts/demo/tts-manifest.json and calls the configured provider
 * (Azure Speech or ElevenLabs) to synthesize each entry's text to MP3.
 *
 * Usage:
 *   npx tsx scripts/demo/generate-tts-assets.ts [--check] [--provider azure|elevenlabs]
 *
 *   --check       Dry run: verify file presence without calling any API.
 *   --provider    Force a specific provider (overrides manifest per-entry provider).
 *
 * Environment variables (never commit real values):
 *   AZURE_SPEECH_KEY, AZURE_SPEECH_REGION
 *   ELEVENLABS_API_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface ManifestEntry {
  id: string;
  lang: string;
  text: string;
  translationRu?: string;
  translationZh?: string;
  provider: string;
  voice: string;
  speed: number;
  outputFile: string;
}

interface Manifest {
  version: string;
  generatedAt: string | null;
  description: string;
  notes: string[];
  entries: ManifestEntry[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.resolve(__dirname, './tts-manifest.json');
const OUTPUT_DIR = path.resolve(__dirname, '../../public/demo-audio');
const OUTPUT_DIR_WITH_SEP = OUTPUT_DIR.endsWith(path.sep) ? OUTPUT_DIR : `${OUTPUT_DIR}${path.sep}`;

// ─── Azure Speech ───

const AZURE_TTS_URL = 'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1';

function buildAzureSSML(text: string, voice: string, speed: number): string {
  const rate = speed !== 100 ? ` rate="${speed}%"` : '';
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
    <voice name="${voice}">
      <prosody${rate}>${escapeXml(text)}</prosody>
    </voice>
  </speak>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function synthesizeAzure(entry: ManifestEntry): Promise<Buffer> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) throw new Error('AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be set');

  const url = AZURE_TTS_URL.replace('{region}', region);
  const ssml = buildAzureSSML(entry.text, entry.voice, entry.speed);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
    },
    body: ssml
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Azure TTS failed (${res.status}): ${errText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// ─── ElevenLabs ───

async function synthesizeElevenLabs(entry: ManifestEntry): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY must be set');

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${entry.voice}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: entry.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        speed: entry.speed / 100
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${errText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// ─── Main ───

async function main() {
  const args = process.argv.slice(2);
  const onlyCheck = args.includes('--check');
  const forceProvider = args.find(a => a.startsWith('--provider='))?.split('=')[1];

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of manifest.entries) {
    const basename = path.basename(entry.outputFile);
    if (!/^[a-zA-Z0-9_-]+\.mp3$/.test(basename)) {
      console.error(`[FAIL] ${entry.outputFile} — outputFile must be a .mp3 basename (alphanumeric, hyphens, underscores)`);
      failed++;
      continue;
    }
    const outputPath = path.resolve(OUTPUT_DIR, basename);
    if (!outputPath.startsWith(OUTPUT_DIR_WITH_SEP)) {
      console.error(`[FAIL] ${basename} — path traversal rejected`);
      failed++;
      continue;
    }

    if (fs.existsSync(outputPath)) {
      console.log(`[SKIP] ${basename} — already exists`);
      skipped++;
      continue;
    }

    if (onlyCheck) {
      console.log(`[MISS] ${basename} — not generated yet`);
      failed++;
      continue;
    }

    const provider = forceProvider || entry.provider;
    const label = `[${entry.id}] ${entry.text.slice(0, 40)}...`;

    try {
      let audio: Buffer;
      if (provider === 'azure') {
        audio = await synthesizeAzure(entry);
      } else if (provider === 'elevenlabs') {
        audio = await synthesizeElevenLabs(entry);
      } else {
        console.warn(`[WARN] ${label} unknown provider "${provider}", skipping`);
        failed++;
        continue;
      }

      fs.writeFileSync(outputPath, audio);
      generated++;
      console.log(`[OK]   ${label} → ${entry.outputFile} (${(audio.length / 1024).toFixed(1)} KB)`);

      // Respect API rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (err: any) {
      failed++;
      console.error(`[FAIL] ${label} ${err.message}`);
    }
  }

  // Update manifest with generation timestamp
  if (generated > 0 && !onlyCheck) {
    manifest.generatedAt = new Date().toISOString();
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) {
    if (onlyCheck) {
      console.log('Some files are missing. Run without --check to generate them.');
    } else {
      console.log('Manual fallback: download MP3 from provider console and place in public/demo-audio/');
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
