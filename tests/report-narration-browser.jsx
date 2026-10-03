import { HealthProvider } from '../src/context/HealthContext';
import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SpeechProvider, useSpeech } from '../src/context/SpeechContext';
import { useReportNarration } from '../src/hooks/useReportNarration';
import { getReport3Speech } from '../src/voice/reportVoice';
window.IS_REACT_ACT_ENVIRONMENT=true;
window.speechSynthesis={cancel(){},getVoices:()=>[],addEventListener(){},removeEventListener(){}};
window.fetch=async()=>({ok:false,status:503});
let spoken=0, latest='', audio;
const checks=[];
function assert(value,message){if(!value)throw Error(message);checks.push('PASS '+message);}
export function Page({value}){audio=useSpeech();useReportNarration(()=>{spoken++;latest=value;});return <div>{value}</div>;}
const root=createRoot(document.getElementById('app'));
const render=value=>act(async()=>root.render(<StrictMode><HealthProvider><SpeechProvider><Page value={value}/></SpeechProvider></HealthProvider></StrictMode>));
const wait=ms=>act(async()=>new Promise(resolve=>setTimeout(resolve,ms)));
async function run(){
 localStorage.setItem('reliv_muted','true');
 await render('first'); await wait(100); await render('latest');await wait(500);
 assert(spoken===1,'StrictMode and rerender produce exactly one automatic introduction');
 assert(latest==='latest','pending introduction uses latest authorized data');
 assert(audio.muted===false,'report entry restores app sound');
 await render('ordinary rerender');await wait(500);
 assert(spoken===1,'ordinary rerender does not restart narration');
 await act(async()=>root.render(<HealthProvider><SpeechProvider><Page key="new" value="next page"/></SpeechProvider></HealthProvider>));
 await act(async()=>root.unmount());await wait(500);
 assert(spoken===1,'leaving before playback cancels pending narration');
 for(const lang of ['en','hi','bn']){
  const empty=getReport3Speech({vitals:{},visitSummary:{scanCount:6}},lang);
  assert(!empty.includes('99')&&!empty.includes('63')&&!empty.includes('98')&&!empty.includes('72'),'no invented fallback measurements in '+lang);
  const actual=getReport3Speech({vitals:{systolic:138,diastolic:77},visitSummary:{scanCount:6}},lang);
  assert(actual.includes('138')&&actual.includes('77')&&actual.includes('6'),'actual readings and visit count spoken in '+lang);
 }
 document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>document.getElementById('results').textContent='FAIL '+e.stack);
