// Build-time speech pack. Samples contain generic words/numbers, never patient data.
import { reportAudioVocabulary } from '../src/voice/reportAudio.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const buildDirectory=process.env.RELIV_AUDIO_BUILD_DIR||join(tmpdir(),'reliv-insight-audio-build');
await mkdir(buildDirectory,{recursive:true});
const vocabularyPath=join(buildDirectory,'vocabulary.json');
const jobs=Object.fromEntries(['en','hi','bn'].map(lang=>[lang,[...new Set(reportAudioVocabulary(lang))]]));
await writeFile(vocabularyPath,JSON.stringify(jobs));
const child=spawn(process.env.RELIV_TTS_PYTHON||'python3',['scripts/build_audio_sprites.py',vocabularyPath],{stdio:'inherit'});
child.on('exit',code=>process.exit(code||0));
