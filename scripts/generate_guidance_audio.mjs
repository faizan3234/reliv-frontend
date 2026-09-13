// Build-time only: create static female recordings for offline kiosk guidance.
// Install edge-tts in a venv, then run: python path/to/venv ... (see docs).
import { GUIDANCE } from '../src/voice/guidanceCopy.js';
import { dict as payment } from '../src/config/PaymentDict.js';
import { dict as services } from '../src/config/TwoOptionsDict.js';
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat, mkdir, rename, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const audioDir = fileURLToPath(new URL('../public/assets/audio/', import.meta.url));
const manifestPath = join(audioDir, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const voices = { en: 'en-IN-NeerjaNeural', hi: 'hi-IN-SwaraNeural', bn: 'bn-IN-TanishaaNeural' };
const jobs = new Map();
for (const translations of Object.values({ ...GUIDANCE, ...payment, ...services })) {
  for (const [language, voice] of Object.entries(voices)) {
    const text = translations[language];
    if (!text) throw new Error(`Missing ${language} translation`);
    const filename = createHash('md5').update(text).digest('hex') + '.mp3';
    jobs.set(`${language}/${filename}`, { language, voice, text, filename });
  }
}
const python = process.env.RELIV_TTS_PYTHON || 'python3';
const worker = String.raw`
import asyncio, sys, os
import edge_tts
from edge_tts import communicate
# Keep TLS verification enabled; optionally trust a locally managed CA bundle.
if os.environ.get('RELIV_TTS_CA_FILE'):
    communicate._SSL_CTX.load_verify_locations(os.environ['RELIV_TTS_CA_FILE'])
async def main():
    await asyncio.wait_for(edge_tts.Communicate(sys.argv[1], sys.argv[2], rate='-5%').save(sys.argv[3]), timeout=45)
asyncio.run(main())
`;
let generated = 0;
async function generate(job) {
  const directory = join(audioDir, job.language);
  await mkdir(directory, { recursive: true });
  const destination = join(directory, job.filename);
  if ((await stat(destination).catch(() => null))?.size > 1000) {
    manifest[job.text] = job.filename;
    return;
  }
  const temporary = destination + '.partial';
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(python, ['-c', worker, job.text, job.voice, temporary], { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      child.stderr.on('data', data => { stderr = (stderr + data).slice(-3000); });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(stderr || `TTS exited ${code}`)));
    });
    if ((await stat(temporary)).size < 1000) throw new Error('Recording is empty');
    await rename(temporary, destination);
    manifest[job.text] = job.filename;
    generated++;
  } finally {
    await rm(temporary, { force: true });
  }
}
const pending = [...jobs.values()];
// Six requests at a time; no shell interpolation of speech text.
for (let offset = 0; offset < pending.length; offset += 6) {
  const results = await Promise.allSettled(pending.slice(offset, offset + 6).map(generate));
  const failure = results.find(result => result.status === 'rejected');
  if (failure) throw failure.reason;
  console.log(`Audio ready: ${Math.min(offset + 6, pending.length)}/${pending.length}`);
}
// Publish the manifest only when every required recording is present.
await writeFile(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n');
await rename(manifestPath + '.tmp', manifestPath);
console.log(`Generated ${generated} recordings. All ${pending.length} guidance recordings are present.`);
