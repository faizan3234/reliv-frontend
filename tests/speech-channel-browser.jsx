import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {HealthProvider} from '../src/context/HealthContext';
import {SpeechProvider,useSpeech} from '../src/context/SpeechContext';
window.IS_REACT_ACT_ENVIRONMENT=true;
const audio=[], checks=[];let api,contexts=0,closed=0,synth=null;
window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
window.Audio=class{constructor(){this.paused=true;audio.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
window.AudioContext=class{state='suspended';constructor(){contexts++;}resume(){return Promise.reject(new Error('blocked'));}close(){closed++;return Promise.resolve();}};
window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
window.speechSynthesis={getVoices:()=>[{lang:'en-IN',localService:true,name:'Female'}],cancel(){synth=null;},speak(u){if(audio.some(a=>!a.paused))throw new Error('two audio channels overlapped');synth=u;},addEventListener(){},removeEventListener(){}};
window.fetch=async(url)=>String(url).endsWith('/api/speech/audio')?{ok:true,blob:async()=>new Blob(['test'])}:{ok:true,json:async()=>({})};
export function Probe(){api=useSpeech();return <p>Speech test</p>;}
function assert(ok,text){if(!ok)throw new Error(text);checks.push('PASS '+text);}
const flush=()=>act(async()=>new Promise(r=>setTimeout(r,20)));
async function run(){
 const root=createRoot(document.getElementById('app'));
 await act(async()=>root.render(<HealthProvider><SpeechProvider><Probe/></SpeechProvider></HealthProvider>));await flush();
 await act(async()=>{void api.speakText('first result');});await flush();
 assert(audio.filter(a=>!a.paused).length===1,'first narration owns one audio channel');
 await act(async()=>{void api.speakText('next result');});await flush();
 assert(audio[0].paused&&audio.filter(a=>!a.paused).length===1,'new page pauses old audio before starting');
 const playing=audio.at(-1);await act(async()=>playing.onerror());await flush();
 assert(playing.paused&&synth?.text==='next result','fallback releases HTML audio before browser speech');
 await act(async()=>api.stop());assert(!synth&&audio.every(a=>a.paused),'stop releases both engines');
 await act(async()=>{for(let i=0;i<10;i++)api.enableReportAudio();});await flush();
 assert(contexts===1,'repeated report entry reuses one unlock context and handles blocked resume');
 await act(async()=>{api.setVolume(NaN);api.setVolume(Infinity);});
 assert(Number.isFinite(api.volume),'invalid volume cannot poison audio state');
 await act(async()=>{void api.speakText('last result');});await flush();
 await act(async()=>root.unmount());assert(audio.every(a=>a.paused)&&closed===1,'unmount silences narration and releases unlock context');
 document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+e.stack;});
