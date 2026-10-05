import { reviewCopy } from '../src/voice/reviewGuidance.js';
// Build-time generic phrases only. The offline kiosk assembles actual patient values locally.
import { personalizedReportCopy } from '../src/voice/personalizedReportCopy.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const dir = process.env.RELIV_AUDIO_BUILD_DIR || join(tmpdir(), 'reliv-personalized-audio');
await mkdir(dir, {recursive:true});
const file = join(dir, 'phrases.json');
await writeFile(file, JSON.stringify(Object.fromEntries(Object.entries(personalizedReportCopy).map(([lang,c])=>[lang,Object.values(c).flat().concat(Object.values(reviewCopy[lang]))]))));
const child = spawn(process.env.RELIV_TTS_PYTHON || 'python3', ['scripts/build_personalized_audio.py', file], {stdio:'inherit'});
child.on('error', error => { console.error(error.message); process.exitCode=1; });
child.on('exit', code => { process.exitCode=code ?? 1; });
