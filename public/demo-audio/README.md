# Demo Audio Assets — Placeholder

This directory is a **placeholder** for pre-generated TTS MP3 files.

- Manifest: `scripts/demo/tts-manifest.json` (14 entries: 8 CN + 6 RU).
- Generator: `scripts/demo/generate-tts-assets.ts`.
- Offline playback requires files to exist here. Run generation before demo:

  ```bash
  # Set env vars first (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, ELEVENLABS_API_KEY)
  npx tsx scripts/demo/generate-tts-assets.ts
  ```

- Never commit real API keys. Keys come from environment variables only.
- Verify completeness: `npx tsx scripts/demo/generate-tts-assets.ts --check`
  (exits non-zero if any file is missing)
