// Build-time only: no patient data and no runtime cloud dependency.
import { reportCopy } from '../src/voice/guidedReport.js';
import { entryCopy, paymentValue } from '../src/voice/entryGuide.js';
import { medicineGuide } from '../src/voice/medicineGuide.js';
import {createHash} from 'node:crypto';
import {readFile,writeFile,stat,rename,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const directory=new URL('../public/assets/audio/',import.meta.url);
const manifestPath=new URL('manifest.json',directory);
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const voices={en:'en-IN-NeerjaNeural',hi:'hi-IN-SwaraNeural',bn:'bn-IN-TanishaaNeural'};
const worker=`import asyncio,sys,os,edge_tts\nfrom edge_tts import communicate\nif os.environ.get("SSL_CERT_FILE"): communicate._SSL_CTX.load_verify_locations(os.environ["SSL_CERT_FILE"])\nasync def main():\n await asyncio.wait_for(edge_tts.Communicate(sys.argv[1],sys.argv[2],rate='-5%').save(sys.argv[3]),timeout=60)\nasyncio.run(main())`;
const jobs=[];
for(const lang of Object.keys(voices)){
 const w=reportCopy[lang],e=entryCopy[lang],m=medicineGuide[lang];
 for(const text of [...w.guides,w.baseline,w.comparison,w.trend,e.choose,e.nameHelp,e.detailsHelp,e.pinHelp,e.returnHelp,e.saving,e.error,e.wrong,paymentValue[lang],m.chooseText,...Object.entries(m).filter(([k])=>k.endsWith('Text')).map(([,v])=>v)]){
  const file=createHash('md5').update(text).digest('hex')+'.mp3';
  jobs.push({lang,text,file});
 }
}
let generated=0;
async function generate({lang,text,file}){
 const destination=new URL(`${lang}/${file}`,directory).pathname;
 if((await stat(destination).catch(()=>null))?.size>1000){manifest[text]=file;return;}
 const temporary=destination+'.partial';
 try{
  await new Promise((resolve,reject)=>{const p=spawn(process.env.RELIV_TTS_PYTHON||'python3',['-c',worker,text,voices[lang],temporary]);let error='';p.stderr.on('data',c=>error+=c);p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error(error)));});
  if((await stat(temporary)).size<1000)throw new Error('Empty recording');
  await rename(temporary,destination);manifest[text]=file;generated++;
 }finally{await rm(temporary,{force:true});}
}
const unique=[...new Map(jobs.map(j=>[j.lang+'/'+j.file,j])).values()];
for(let i=0;i<unique.length;i+=4){await Promise.all(unique.slice(i,i+4).map(generate));await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');}
console.log(`Verified ${jobs.length} recordings; generated ${generated}.`);
