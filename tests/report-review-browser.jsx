import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {HealthProvider} from '../src/context/HealthContext';
import {SpeechProvider} from '../src/context/SpeechContext';
import {VoiceAssistantProvider} from '../src/context/VoiceAssistantContext';
import CustomerDetails from '../src/pages/CustomerDetails';
import ProtectedReportRoute from '../src/components/ProtectedReportRoute';
import ReferenceReports from '../src/pages/ReferenceReports';
import {readProfileAccess,readReportReviewSession,clearKioskSession} from '../src/utils/kioskSession';
import manifest from '../public/assets/audio/manifest.json';
import '../src/i18n';
window.IS_REACT_ACT_ENVIRONMENT=true;
const wait=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>ms===450?wait(fn,5,...args):ms>=400?-1:wait(fn,ms,...args);
window.WebSocket=class{static OPEN=1;readyState=0;send(){}close(){}};
window.speechSynthesis={cancel(){},getVoices:()=>[],addEventListener(){},removeEventListener(){}};
const played=[];window.Audio=class{constructor(url){this.url=url;}play(){played.push(this.url);queueMicrotask(()=>this.onended?.());return Promise.resolve();}pause(){}};
let enabled=true,reject=false,noReport=false,root;const requests=[];
const report={ok:true,paymentVerified:true,reportStatus:'READY',sessionId:'PAID-SEVEN',customerData:{name:'Saved Person',age:30,gender:'male'},healthData:{reportScanNumber:7,scanCount:3,visitSummary:{scanCount:3},vitals:{height:180,weight:90,systolic:118,diastolic:76,bpm:72,oxygen:98,temperature:98.4},history:[]}};
window.fetch=async(url,opts={})=>{
 const path=String(url);requests.push({path,method:opts.method||'GET',headers:opts.headers});
 let data={ok:true},status=200;
 if(path.endsWith('manifest.json'))data=manifest;
 else if(path.endsWith('/api/kiosk/features'))data={ok:true,reportReviewMode:enabled};
 else if(path.endsWith('/api/health-profiles/review')){status=reject?401:noReport?404:200;data=status===200?{ok:true,sessionId:'PAID-SEVEN',accessToken:'d'.repeat(64),expiresAt:Date.now()+1800000}:{ok:false,code:noReport?'NO_SAVED_REPORT':undefined,error:'Rejected'};}
 else if(path.includes('/report/data'))data=report;
 return {ok:status===200,status,json:async()=>data};
};
const checks=[];function assert(ok,text){if(!ok)throw Error(text);checks.push('PASS '+text);}
async function flush(){await act(async()=>new Promise(r=>wait(r,30)));}
async function mount(){if(root)await act(async()=>root.unmount());localStorage.clear();sessionStorage.clear();root=createRoot(document.getElementById('app'));await act(async()=>root.render(<MemoryRouter initialEntries={['/customer-details']}><HealthProvider><SpeechProvider><VoiceAssistantProvider><Routes><Route path="/customer-details" element={<CustomerDetails/>}/><Route path="/report-1" element={<ProtectedReportRoute><ReferenceReports/></ProtectedReportRoute>}/><Route path="/two-options" element={<p>Normal choices</p>}/></Routes></VoiceAssistantProvider></SpeechProvider></HealthProvider></MemoryRouter>));await flush();}
async function click(part){const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(part));assert(b,'button '+part);await act(async()=>b.click());await flush();}
async function enter(){const input=document.querySelector('input[name=name]');assert(input,'review opens directly at name');await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'Saved Person');input.dispatchEvent(new Event('input',{bubbles:true}));});await click('Continue');for(const d of ['4','2','3','1','8','9']){const b=document.querySelector(`[aria-label="Digit ${d}"]`);await act(async()=>b.click());}}
async function submit(){const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Open my report'));assert(b,'submit PIN');await act(async()=>{b.click();b.click();});await flush();await flush();}
async function run(){
 enabled=false;await mount();assert(document.body.textContent.includes('My first health check')&&document.body.textContent.includes('I have checked here before'),'flag off preserves normal choices');
 enabled=true;await mount();assert(!document.body.textContent.includes('My first health check'),'flag on hides new/returning choices');await enter();const before=requests.filter(r=>r.path.endsWith('/api/health-profiles/review')).length;await submit();
 assert(requests.filter(r=>r.path.endsWith('/api/health-profiles/review')).length===before+1,'double tap makes one review login');
 assert(document.querySelector('.reference-progress')?.textContent.includes('Scan 7'),'saved scan seven overrides stale summary scan three');
 assert(played.some(p=>p.includes('/assets/audio/en/')),'saved report speaks through normal report audio');
 assert(readReportReviewSession()==='PAID-SEVEN'&&readProfileAccess('PAID-SEVEN')==='d'.repeat(64),'review identity supports reload and private report authorization');
 assert(!requests.some(r=>/create-qr-session|payment|measurements|health-profile$/.test(r.path)),'review never creates a scan, payment or measurement');
 assert(requests.some(r=>r.path.includes('/report/data')&&r.headers['X-Reliv-Profile-Token']==='d'.repeat(64)),'report still requires the PIN credential');
 clearKioskSession();assert(readReportReviewSession()===null&&readProfileAccess('PAID-SEVEN')===null,'finish/timeout clears review credentials');
 reject=true;await mount();await enter();await submit();assert(!document.querySelector('.reference-reports'),'wrong PIN never opens report');
 reject=false;noReport=true;await mount();await enter();await submit();assert(document.querySelector('[role=alert]')?.textContent.includes('no completed paid report'),'empty profile gets clear no-report message');
 await act(async()=>root.unmount());document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+e.stack);
