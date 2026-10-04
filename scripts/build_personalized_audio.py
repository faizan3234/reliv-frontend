"""Generate generic female voice recordings at build time; no runtime network or patient data."""
import asyncio, hashlib, json, os, pathlib, sys
import edge_tts
from edge_tts import communicate
if os.environ.get('SSL_CERT_FILE'):
    communicate._SSL_CTX.load_verify_locations(os.environ['SSL_CERT_FILE'])
root = pathlib.Path('public/assets/audio')
voices = {'en':'en-IN-NeerjaNeural','hi':'hi-IN-SwaraNeural','bn':'bn-IN-TanishaaNeural'}
jobs = json.loads(pathlib.Path(sys.argv[1]).read_text())
manifest = json.loads((root/'manifest.json').read_text())
async def main():
    semaphore = asyncio.Semaphore(4)
    async def generate(lang, text):
        name = 'personal-' + hashlib.sha256(text.encode()).hexdigest()[:24] + '.mp3'
        file = root/lang/name
        if not file.exists() or file.stat().st_size < 500:
            async with semaphore:
                await asyncio.wait_for(edge_tts.Communicate(text, voices[lang],rate='-5%',proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')).save(str(file)+'.partial'),45)
                pathlib.Path(str(file)+'.partial').replace(file)
        manifest[text] = {**(manifest.get(text) if isinstance(manifest.get(text),dict) else {}),lang:{'file':name}}
    await asyncio.gather(*(generate(lang,text) for lang,texts in jobs.items() for text in texts))
asyncio.run(main())
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Recorded personalized report vocabulary for all three languages.')
