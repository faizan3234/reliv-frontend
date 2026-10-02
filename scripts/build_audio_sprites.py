"""Build repeatable compressed offline speech sprites; requires edge-tts and ffmpeg."""
import asyncio, hashlib, json, os, pathlib, subprocess, sys
import edge_tts
from edge_tts import communicate
if os.environ.get('SSL_CERT_FILE'):
    communicate._SSL_CTX.load_verify_locations(os.environ['SSL_CERT_FILE'])
root = pathlib.Path('public/assets/audio')
cache = pathlib.Path(sys.argv[1]).parent / 'clips'; cache.mkdir(parents=True,exist_ok=True)
voices = {'en':'en-IN-NeerjaNeural','hi':'hi-IN-SwaraNeural','bn':'bn-IN-TanishaaNeural'}
jobs = json.loads(pathlib.Path(sys.argv[1]).read_text())
async def main():
    semaphore = asyncio.Semaphore(5)
    async def generate(lang, text):
        file = cache / (lang + '-' + hashlib.sha256(text.encode()).hexdigest() + '.mp3')
        if file.exists() and file.stat().st_size>500: return
        async with semaphore:
            for attempt in range(4):
                try:
                    await asyncio.wait_for(edge_tts.Communicate(text,voices[lang],rate='-5%',proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')).save(str(file)+'.partial'),60)
                    pathlib.Path(str(file)+'.partial').replace(file); return
                except Exception:
                    if attempt==3: raise
                    await asyncio.sleep(1+attempt)
    for lang, texts in jobs.items():
        await asyncio.gather(*(generate(lang,t) for t in texts))
        print('Recorded',lang,len(texts),flush=True)
asyncio.run(main())
manifest=json.loads((root/'manifest.json').read_text())
for lang,texts in jobs.items():
    entries={}; samples=bytearray()
    for text in texts:
        f=cache/(lang+'-'+hashlib.sha256(text.encode()).hexdigest()+'.mp3')
        pcm=subprocess.check_output(['ffmpeg','-loglevel','error','-i',str(f),'-f','s16le','-ar','24000','-ac','1','-'])
        start=len(samples)/48000; samples.extend(pcm); end=len(samples)/48000
        samples.extend(bytes(14400)) # 300ms guard gap, avoids adjacent speech on seek
        entries[text]={'file':'insights-v1.mp3','start':round(start,5),'end':round(end,5)}
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','s16le','-ar','24000','-ac','1','-i','pipe:0','-c:a','libmp3lame','-b:a','64k',str(root/lang/'insights-v1.mp3')],input=samples,check=True)
    for text,entry in entries.items():
        previous=manifest.get(text)
        manifest[text] = {**(previous if isinstance(previous,dict) else {}),lang:entry}
    print('Packed',lang,round(len(samples)/48000,1),'seconds',flush=True)
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
