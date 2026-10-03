import os

worker_path = r"c:\Users\khanf\Downloads\backend-main\src\services\ttsWorker.py"
worker_content = '''import sys
import asyncio
import edge_tts

async def main():
    if len(sys.argv) < 4:
        print("Usage: ttsWorker.py <text> <voice> <outfile>", file=sys.stderr)
        sys.exit(1)
    text = sys.argv[1]
    voice = sys.argv[2]
    out_file = sys.argv[3]
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_file)

if __name__ == '__main__':
    asyncio.run(main())
'''

with open(worker_path, 'w', encoding='utf-8') as f:
    f.write(worker_content)
print(f"Created {worker_path}")

target_path = r"c:\Users\khanf\Downloads\backend-main\src\routes\localSpeech.js"

content = r'''import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.resolve(__dirname, '..', '..', 'data', 'tts_cache');
const WORKER_SCRIPT = path.resolve(__dirname, '..', 'services', 'ttsWorker.py');

try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not initialize tts_cache directory:', e);
}

// Strictly Female Neural Voices - Exactly matching Reliv Splash screen and kiosk audio
const NEURAL_FEMALE_VOICES = {
  en: 'en-IN-NeerjaNeural',
  hi: 'hi-IN-SwaraNeural',
  bn: 'bn-IN-TanishaaNeural'
};

export function createLocalSpeechHandler({ timeoutMs = 25000 } = {}) {
  let active = 0;

  return async (req, res) => {
    const { text, language } = req.body || {};
    const safeLang = (language && NEURAL_FEMALE_VOICES[language]) ? language : 'en';
    const voice = NEURAL_FEMALE_VOICES[safeLang];

    res.set('Cache-Control', 'public, max-age=86400');

    if (typeof text !== 'string' || !text.trim() || text.length > 3000) {
      return res.status(400).json({ ok: false, error: 'Text must be 1 to 3000 characters.' });
    }

    const trimmedText = text.trim();
    const hash = crypto.createHash('sha256').update(`${safeLang}:${voice}:${trimmedText}`).digest('hex');
    const cachedFile = path.join(CACHE_DIR, `${hash}.mp3`);

    // 1. Fast Cache Hit (< 5ms response)
    if (fs.existsSync(cachedFile)) {
      try {
        const stats = fs.statSync(cachedFile);
        if (stats.size > 500) {
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', stats.size);
          return fs.createReadStream(cachedFile).pipe(res);
        }
      } catch {
        // Fall through to regenerate
      }
    }

    if (active >= 4) {
      return res.status(429).json({ ok: false, error: 'Speech synthesis is busy. Please try again.' });
    }
    active++;

    const tempFile = path.join(CACHE_DIR, `${hash}_${Date.now()}.partial.mp3`);
    let finished = false;
    let timer = null;
    let child = null;

    const cleanup = () => {
      clearTimeout(timer);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
    };

    const done = () => {
      if (!finished) {
        finished = true;
        active = Math.max(0, active - 1);
        cleanup();
      }
    };

    try {
      child = spawn('python', [WORKER_SCRIPT, trimmedText, voice, tempFile], {
        stdio: ['ignore', 'ignore', 'pipe'],
        shell: false
      });

      let stderr = '';
      child.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      child.on('error', (err) => {
        if (finished) return;
        done();
        console.error('Edge-TTS spawn error:', err);
        return res.status(503).json({ ok: false, error: 'Offline speech service unavailable' });
      });

      child.on('close', (code) => {
        if (finished) return;
        clearTimeout(timer);

        if (code === 0 && fs.existsSync(tempFile)) {
          try {
            const stats = fs.statSync(tempFile);
            if (stats.size > 500) {
              fs.renameSync(tempFile, cachedFile);
              done();
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Content-Length', stats.size);
              return fs.createReadStream(cachedFile).pipe(res);
            }
          } catch (e) {
            console.error('Error handling generated speech file:', e);
          }
        }

        done();
        console.error('Edge-TTS generation failed with code:', code, stderr);
        return res.status(503).json({ ok: false, error: 'Speech generation failed' });
      });

      timer = setTimeout(() => {
        if (!finished) {
          try { child?.kill(); } catch {}
          done();
          return res.status(504).json({ ok: false, error: 'Speech generation timed out' });
        }
      }, timeoutMs);

    } catch (err) {
      if (!finished) {
        done();
        return res.status(503).json({ ok: false, error: err.message });
      }
    }
  };
}
'''

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully updated {target_path}")
