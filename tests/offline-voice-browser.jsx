import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HealthProvider } from '../src/context/HealthContext';
import { SpeechProvider } from '../src/context/SpeechContext';
import { VoiceAssistantProvider } from '../src/context/VoiceAssistantContext';
import OrderSuccess from '../src/pages/OrderSuccess';
import SpokenGuide from '../src/components/SpokenGuide';

window.IS_REACT_ACT_ENVIRONMENT = true;
const wait = window.setTimeout.bind(window);
// Trigger speech deliberately; do not let route prompts obscure button checks.
window.setTimeout = (fn, ms, ...args) => ms === 450 ? -1 : wait(fn, ms, ...args);
window.WebSocket = class { static OPEN=1; readyState=0; send() {} close() {} };
window.speechSynthesis = { getVoices:()=>[], cancel(){}, addEventListener(){}, removeEventListener(){}, speak(){throw new Error('Cloud/unknown voice must not run');} };
window.SpeechSynthesisUtterance = class {};
const played=[], speechRequests=[], revoked=[];
let rejectAudio=false, holdSpeech=false, deferred;
window.URL.createObjectURL=()=> 'blob:local-speech';
window.URL.revokeObjectURL=url=>revoked.push(url);
window.Audio=class {
  constructor(url){this.url=url;}
  play(){played.push(this.url); if(rejectAudio) return Promise.reject(new Error('speaker failed')); queueMicrotask(()=>this.onended?.()); return Promise.resolve();}
  pause(){}
};
let status={ok:true,sessionId:'S',serviceType:'MEDICINE',paymentVerified:true,status:'dispensing',dispenseStatus:'IN_PROGRESS',jobsCount:2,jobsCompleted:0};
let networkError=false;
window.fetch=async(url, options={})=>{
  if(String(url).endsWith('/api/speech/audio')) {
    speechRequests.push(JSON.parse(options.body));
    const result={ok:true,blob:async()=>new Blob(['synthetic-wave'])};
    if(holdSpeech) return new Promise(resolve=>{deferred=()=>resolve(result);});
    return result;
  }
  if(String(url).endsWith('/status')) { if(networkError) throw new Error('offline'); return {ok:true,json:async()=>status}; }
  return {ok:true,json:async()=>({})};
};
const checks=[];
function assert(ok, text){if(!ok)throw new Error(text); checks.push('PASS '+text);}
let root;
async function flush(){await act(async()=>new Promise(resolve=>wait(resolve,20)));}
async function click(text){const b=[...document.querySelectorAll('button')].find(x=>x.textContent===text);assert(b, 'button available: '+text);await act(async()=>b.click());await flush();}
async function mount(child){
  if(root)await act(async()=>root.unmount());
  root=createRoot(document.getElementById('app'));
  await act(async()=>root.render(<MemoryRouter initialEntries={[{pathname:'/order-success',state:{sessionId:'S',cart:[{cartQuantity:9}]}}]}><HealthProvider><SpeechProvider><VoiceAssistantProvider>{child}</VoiceAssistantProvider></SpeechProvider></HealthProvider></MemoryRouter>));
  await flush();
}
async function run(){
  await mount(<OrderSuccess/>);
  assert(document.body.textContent.includes('Preparing your items')&&!document.body.textContent.includes('I have collected'),'route cart and elapsed time do not claim delivery');
  await click('Listen to this guide');
  assert(speechRequests.at(-1).language==='en'&&played.at(-1)==='blob:local-speech','missing browser voice plays audio prepared by local backend');
  assert(revoked.length>0,'completed audio URL released');
  status={...status,jobsCompleted:1};await click('Check status again');
  assert(document.body.textContent.includes('1 / 2')&&!document.body.textContent.includes('I have collected'),'partial ACK remains pending');
  status={...status,status:'dispense_complete',dispenseStatus:'COMPLETED',jobsCompleted:2};await click('Check status again');
  assert(document.body.textContent.includes('I have collected my items'),'all backend jobs confirmed enables collection button');
  assert(!/Receipt sent|System Sanitized|UV cleansing/.test(document.body.textContent),'no fabricated email or UV completion');
  status={...status,status:'dispense_review_required',dispenseStatus:'MANUAL_REVIEW_REQUIRED'};await mount(<OrderSuccess/>);
  assert(document.body.textContent.includes('Do not pay again')&&!document.body.textContent.includes('I have collected'),'manual review guides customer without repeating payment');
  networkError=true;await click('Check status again');
  assert(document.body.textContent.includes('cannot confirm'),'connection failure never reports success');
  networkError=false;
  await mount(<SpokenGuide text="আজ অক্সিজেন ৯৮ শতাংশ।" language="bn"/>);
  await click('এই নির্দেশ শুনুন');
  assert(speechRequests.at(-1).language==='bn','Bengali text stays Bengali at local speech service');
  rejectAudio=true;await click('এই নির্দেশ শুনুন');
  assert(document.body.textContent.includes('আওয়াজ পাওয়া যাচ্ছে না')&&document.body.textContent.includes('৯৮'),'audio failure leaves visible localized explanation');
  rejectAudio=false;
  window.speechSynthesis.getVoices=()=>[{lang:'bn-IN',localService:true}];
  window.speechSynthesis.speak=utterance=>queueMicrotask(()=>utterance.onerror?.({error:'synthesis-failed'}));
  const requestsBefore=speechRequests.length;
  await click('এই নির্দেশ শুনুন');
  assert(speechRequests.length===requestsBefore+1,'installed but broken browser voice falls back to local WAV');
  window.speechSynthesis.getVoices=()=>[];
  holdSpeech=true;await click('এই নির্দেশ শুনুন');
  const before=played.length;
  await click('কথা থামান');
  await act(async()=>deferred());await flush();
  assert(played.length===before,'cancelled local speech request cannot start late playback');
  await act(async()=>root.unmount());
  document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(error=>{document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+error.stack;});
