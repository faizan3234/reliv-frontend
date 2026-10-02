import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HealthProvider } from '../src/context/HealthContext';
import { SpeechProvider } from '../src/context/SpeechContext';
import { VoiceAssistantProvider } from '../src/context/VoiceAssistantContext';
import ProtectedReportRoute from '../src/components/ProtectedReportRoute';
import UnifiedReport from '../src/pages/UnifiedReport';
import { getScanCount, reportMeasurements } from '../src/utils/reportSnapshot';
import { chartScans, reportCopy } from '../src/voice/guidedReport';
import manifest from '../public/assets/audio/manifest.json';
import '../src/i18n';
window.IS_REACT_ACT_ENVIRONMENT = true;
const wait=window.setTimeout.bind(window);
window.setTimeout=(fn,ms,...args)=>ms>=400?-1:wait(fn,ms,...args);
window.speechSynthesis={cancel(){},getVoices:()=>[],addEventListener(){},removeEventListener(){},speak(){throw new Error('No offline browser voice');}};
window.WebSocket=class {static OPEN=1;readyState=0;send(){}close(){}};
const played=[]; window.Audio=class{constructor(url){this.url=url;}play(){played.push(this.url);queueMicrotask(()=>this.onended?.());return Promise.resolve();}pause(){}};
const paid={ok:true,paymentVerified:true,reportStatus:'READY',sessionId:'KSK-REPORT-TEST',customerData:{name:'Current Person',age:25,gender:'male'},healthData:{vitals:{height:172.3,weight:65.4,systolic:120,diastolic:80,bpm:72,oxygen:98,temperature:98.4},history:[],scanCount:1}};
let authorized=true,root;
const requests=[];
window.fetch=async(url,options={})=>{requests.push({url:String(url),token:options.headers?.['X-Reliv-Profile-Token']});if(String(url).endsWith('manifest.json'))return {ok:true,json:async()=>manifest};if(String(url).endsWith('/api/speech/audio'))return {ok:false,status:503};return {ok:true,json:async()=>String(url).includes('/report/data')?(authorized?paid:{ok:false}):{}};};
const checks=[];
function assert(ok,text){if(!ok)throw new Error(text);checks.push('PASS '+text);}
async function flush(){await act(async()=>new Promise(r=>wait(r,30)));}
async function mount(page=1){if(root)await act(async()=>root.unmount());localStorage.clear();sessionStorage.clear();localStorage.setItem('reliv_session_id','KSK-REPORT-TEST');sessionStorage.setItem('reliv_profile_access',JSON.stringify({sessionId:'KSK-REPORT-TEST',token:'a'.repeat(64)}));localStorage.setItem('healthData',JSON.stringify({patient:{name:'Previous Person'},vitals:{oxygen:77},history:[]}));root=createRoot(document.getElementById('app'));await act(async()=>root.render(<MemoryRouter initialEntries={[`/report-${page}`]}><HealthProvider><SpeechProvider><VoiceAssistantProvider><ProtectedReportRoute><UnifiedReport/></ProtectedReportRoute></VoiceAssistantProvider></SpeechProvider></HealthProvider></MemoryRouter>));await flush();}
async function click(text){const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===text);assert(b,'button available: '+text);await act(async()=>b.click());await flush();}
async function run(){
 assert(getScanCount({history:Array(7).fill({})})===1,'only authoritative scan count sets visit number');
 assert(reportMeasurements({impedance:500}).every(x=>x.value===null),'raw impedance never substitutes for a measurement');
 for(let p=1;p<=5;p++){
  await mount(p);assert([...document.querySelectorAll('h1')].at(-1).textContent===reportCopy.en.titles[p-1],`direct report ${p} opens its distinct screen`);
  assert(!document.body.textContent.includes('Previous Person'),'stale patient is cleared');
  assert(document.body.textContent.includes('Scan 1'),'first visit is labelled scan one');
  if(p===1)assert(document.body.textContent.includes('cannot measure them reliably'),'no invented metabolic age');
  if(p===2)assert(document.querySelector('[data-metric=height]').textContent.includes('172.3')&&document.querySelector('[data-metric=oxygen]').textContent.includes('98'),'today page includes actual measured values');
  if(p===3)assert(document.querySelectorAll('figure circle').length===6,'first scan has one point for each of six coloured measurements');
  if(p===4)assert(document.querySelectorAll('figure rect').length===6,'first scan has one bar for each of six measurements');
  const before=played.length;await click('Listen to this guide');assert(played.length>=before+2&&played[before].startsWith('/assets/audio/en/'),'recorded page and scan explanation play without speech engine');
  assert(!requests.some(x=>x.url.endsWith('/api/speech/audio')),'all report explanations and values are bundled for offline playback');
 }
 await mount(1);for(let p=2;p<=5;p++){await click('Next page →');assert([...document.querySelectorAll('h1')].at(-1).textContent===reportCopy.en.titles[p-1],`Next opens screen ${p}`);}
 for(const [code,label,listen] of [['hi','हिंदी','यह निर्देश सुनें'],['bn','বাংলা','এই নির্দেশ শুনুন']]){await click(label);await click(listen);assert(played.some(url=>url.startsWith(`/assets/audio/${code}/`)),code+' recorded narration plays');assert([...document.querySelectorAll('h1')].at(-1).textContent===reportCopy[code].titles[4],code+' report labels translated');}
 paid.healthData.scanCount=7;paid.healthData.history=Array.from({length:7},(_,i)=>({systolic:114+i,oxygen:i===3?null:98,createdAt:`2026-10-0${i+1}`}));
 await mount(3);assert(document.querySelectorAll('figure circle').length===13,'overview draws all available readings with a real gap');await click('Oxygen');assert(document.querySelectorAll('figure circle').length===6,'missing reading leaves a gap');
 await mount(4);assert(document.querySelectorAll('figure rect').length===13,'seventh scan has all available comparison bars');
 assert(chartScans({scanCount:105,history:Array(100).fill({oxygen:98})})[0].scan===99,'recent chart keeps lifetime scan numbering');
 assert(requests.some(x=>x.token==='a'.repeat(64)),'private token protects history requests');
 assert(!requests.some(x=>x.url.includes('/reports/history/')),'no public email history lookup');
 authorized=false;await mount(2);assert(!document.querySelector('[aria-label="Health screening report"]'),'unpaid response cannot show report');
 await act(async()=>root.unmount());document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+e.stack;});
