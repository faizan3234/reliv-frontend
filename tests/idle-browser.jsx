import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {HealthProvider,useHealth} from '../src/context/HealthContext';
import {SpeechProvider} from '../src/context/SpeechContext';
import IdleReturn from '../src/components/IdleReturn';
window.IS_REACT_ACT_ENVIRONMENT=true;
const wait=window.setTimeout.bind(window),now=Date.now;let offset=0,tick;
Date.now=()=>now()+offset;
window.setInterval=fn=>{tick=fn;return 1;};window.clearInterval=()=>{};
window.setTimeout=(fn,ms,...args)=>ms===450?-1:wait(fn,ms,...args);
window.speechSynthesis={cancel(){},getVoices:()=>[],addEventListener(){},removeEventListener(){}};
window.fetch=async()=>({ok:true,json:async()=>({})});
let path,health,root;const checks=[];
export function Probe(){path=useLocation().pathname;health=useHealth();return <IdleReturn/>;}
function assert(ok,text){if(!ok)throw new Error(text);checks.push('PASS '+text);}
async function mount(route){if(root)await act(async()=>root.unmount());offset=0;tick=null;localStorage.clear();sessionStorage.clear();localStorage.setItem('healthData',JSON.stringify({patient:{name:'Private Patient'},vitals:{oxygen:98}}));localStorage.setItem('reliv_session_id','KSK-IDLE');localStorage.setItem('reliv_pairing_token','token');sessionStorage.setItem('reliv_profile_access','private-token');root=createRoot(document.getElementById('app'));await act(async()=>root.render(<MemoryRouter initialEntries={[route]}><HealthProvider><SpeechProvider><Probe/></SpeechProvider></HealthProvider></MemoryRouter>));}
async function advance(ms){offset+=ms;await act(async()=>tick?.());}
async function run(){
 await mount('/customer-details');await advance(120001);assert(document.querySelector('[role="dialog"]'),'unpaid visit gets warning before reset');
 const stay=[...document.querySelectorAll('button')].find(b=>b.textContent==='Continue my visit');await act(async()=>{stay.dispatchEvent(new Event('pointerdown',{bubbles:true}));stay.click();});assert(!document.querySelector('[role="dialog"]')&&health.data.patient.name,'continue preserves active visit');
 await advance(120001);await advance(30000);assert(path==='/'&&!health.data.patient.name&&!sessionStorage.getItem('reliv_profile_access')&&!localStorage.getItem('reliv_session_id'),'abandoned visit clears patient, session and private access');
 await mount('/report-3');await advance(120001);assert(!document.querySelector('[role="dialog"]'),'report has four minutes for reading');await advance(120000);assert(document.querySelector('[role="dialog"]'),'report warns after four minutes');
 await mount('/payment');await advance(240001);assert(!document.querySelector('[role="dialog"]'),'phone payment is not interrupted at normal timeout');await advance(360000);assert(document.querySelector('[role="dialog"]'),'payment warns after ten minutes');
 await mount('/order-success');assert(tick===null,'pending physical collection never auto-clears');
 await mount('/advertise');assert(tick===null,'phone advertising upload is excluded');
 await act(async()=>root.unmount());document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+e.stack;});
