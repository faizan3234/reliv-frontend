import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HealthProvider } from '../src/context/HealthContext';
import { SpeechProvider } from '../src/context/SpeechContext';
import { VoiceAssistantProvider } from '../src/context/VoiceAssistantContext';
import ProtectedReportRoute from '../src/components/ProtectedReportRoute';
import ReferenceReports from '../src/pages/ReferenceReports';


import manifest from '../public/assets/audio/manifest.json';
import '../src/i18n';
window.IS_REACT_ACT_ENVIRONMENT = true;
const wait=window.setTimeout.bind(window);
window.setTimeout=(fn,ms,...args)=>ms===450?wait(fn,10,...args):ms>=400?-1:wait(fn,ms,...args);
window.speechSynthesis={cancel(){},getVoices:()=>[],addEventListener(){},removeEventListener(){},speak(){throw new Error('No offline browser voice');}};
window.WebSocket=class {static OPEN=1;readyState=0;send(){}close(){}};
const played=[]; window.Audio=class{constructor(url){this.url=url;}play(){played.push(this.url);queueMicrotask(()=>this.onended?.());return Promise.resolve();}pause(){}};
const longPaymentUrl = 'https://reliv7.vercel.app/pay#p=' + 'a'.repeat(2450);
const paid={ok:true,paymentVerified:true,reportStatus:'READY',sessionId:'KSK-REPORT-TEST',customerData:{name:'Current Person',age:25,gender:'male'},healthData:{reportPaymentUrl:longPaymentUrl,vitals:{height:172.3,weight:65.4,systolic:120,diastolic:80,bpm:72,oxygen:98,temperature:98.4},history:[],scanCount:1}};
let authorized=true,root;
window.URL.createObjectURL=()=>"blob:personal-report";
window.URL.revokeObjectURL=()=>{};
const speechRequests=[];
const spoken=[];window.addEventListener("reliv_spoken_text",e=>spoken.push(e.detail));
const requests=[];
window.fetch=async(url,options={})=>{requests.push({url:String(url),token:options.headers?.['X-Reliv-Profile-Token']});if(String(url).endsWith('manifest.json'))return {ok:true,json:async()=>manifest};if(String(url).endsWith('/api/speech/audio')){speechRequests.push(JSON.parse(options.body));return {ok:true,blob:async()=>new Blob(['wav'])};}return {ok:true,json:async()=>String(url).includes('/report/data')?(authorized?paid:{ok:false}):{}};};
const checks=[];
function assert(ok,text){if(!ok)throw new Error(text);checks.push('PASS '+text);}
async function flush(){await act(async()=>new Promise(r=>wait(r,30)));}
async function mount(page=1){if(root)await act(async()=>root.unmount());localStorage.clear();sessionStorage.clear();localStorage.setItem('reliv_session_id','KSK-REPORT-TEST');sessionStorage.setItem('reliv_profile_access',JSON.stringify({sessionId:'KSK-REPORT-TEST',token:'a'.repeat(64)}));localStorage.setItem('healthData',JSON.stringify({patient:{name:'Previous Person'},vitals:{oxygen:77},history:[]}));root=createRoot(document.getElementById('app'));await act(async()=>root.render(<MemoryRouter initialEntries={[`/report-${page}`]}><HealthProvider><SpeechProvider><VoiceAssistantProvider><ProtectedReportRoute><ReferenceReports/></ProtectedReportRoute></VoiceAssistantProvider></SpeechProvider></HealthProvider></MemoryRouter>));await flush();}
async function run(){
 for(const count of [1,4,6,7]) {
  paid.healthData.scanCount=count;
  paid.healthData.visitSummary={scanCount:count};
  paid.healthData.history=Array.from({length:count},(_,i)=>({scanNumber:i+1,createdAt:`2026-09-${String(i+1).padStart(2,'0')}`,patient:{age:25,gender:'male'},...paid.healthData.vitals}));
  for(let page=1;page<=5;page++) {
   const beforeAudio=played.length, beforeRequests=speechRequests.length;
   await mount(page);
   assert(played.length>beforeAudio && played.at(-1).startsWith("/assets/audio/"), `report ${page} automatically plays bundled audio`);
   assert(speechRequests.length===beforeRequests && spoken.includes(String(count)), `report ${page} narrates actual visit count without runtime TTS`);
   assert(document.querySelector('.reference-progress').textContent.includes(`Scan ${count}`),`original layout page ${page} keeps scan ${count}`);
   assert(Boolean(document.querySelector('.reference-back')) === (page>1&&page<5), 'Back available only on report pages 2–4');
   if(page===4&&count>=6)assert(document.querySelectorAll('.journey-details tbody tr').length===7,'scan six adds seven bounded measured comparisons');
   assert(!document.body.textContent.includes('Previous Person'),'no previous patient leaks');
   assert(!document.body.textContent.includes('NaN')&&!document.body.textContent.includes('Infinity'),'numbers remain finite');
   if(page===2) assert(document.body.textContent.includes('Bone'),'original body-system cards restored');
   if(page===5) assert([...document.querySelectorAll('svg title')].some(node=>node.textContent==='Reopen your paid Reliv visit'),'same signed paid QR retained in final original layout');
   if(page===4&&count>1)assert(document.querySelectorAll('figure').length===1,'single combined graph in original report card');
  }
 }
 assert(!requests.some(r=>r.url.includes('/reports/history/')||r.url.includes('supabase')||r.url.includes('/save-report')),'no online history, duplicate report saves or leaderboard calls');
 assert(requests.some(r=>r.token==='a'.repeat(64)),'PIN credential still authorizes report access');
 paid.healthData.vitals={};paid.healthData.history=[];
 for(let page=1;page<=5;page++){await mount(page);assert(document.querySelector('.reference-progress'),'missing measurements do not crash original layout '+page);}
 authorized=false;await mount(1);assert(!document.querySelector('.reference-reports'),'unpaid response cannot open restored layouts');
 await act(async()=>root.unmount());document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+e.stack;});
