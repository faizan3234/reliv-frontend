import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import CustomerDetails from '../src/pages/CustomerDetails';
import {HealthProvider} from '../src/context/HealthContext';
import {SpeechProvider} from '../src/context/SpeechContext';
import {VoiceAssistantProvider} from '../src/context/VoiceAssistantContext';
import '../src/i18n';
window.IS_REACT_ACT_ENVIRONMENT=true;
window.speechSynthesis={cancel(){},getVoices:()=>[],addEventListener(){},removeEventListener(){}};
window.WebSocket=class {static OPEN=1;readyState=0;send(){}close(){}};
const calls=[],checks=[],output=document.getElementById('results');
window.fetch=async(url,options={})=>{
 const path=String(url),body=JSON.parse(options.body||'{}');calls.push({path,body});
 return {ok:true,status:200,json:async()=>path.endsWith('/api/kiosk/features')?{reportReviewMode:false}:path.includes('/create-qr-session')||path.endsWith('/api/sessions')?{sessionId:'KSK-MEDICINE',pairingToken:'test-pair'}:{ok:true}};
};
const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push('PASS '+message);};
const wait=()=>new Promise(r=>setTimeout(r,15));
async function click(match){const b=[...document.querySelectorAll('button')].find(x=>match.test(x.textContent));assert(b,'button exists: '+match);await act(async()=>b.click());await act(wait);}
async function input(id,value){await act(async()=>{const el=document.getElementById(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});}
async function run(){
 localStorage.clear();sessionStorage.clear();const root=createRoot(document.getElementById('app'));
 await act(async()=>root.render(<MemoryRouter initialEntries={['/customer-details']}><HealthProvider><SpeechProvider><VoiceAssistantProvider><Routes><Route path="/customer-details" element={<CustomerDetails/>}/><Route path="/medicine-dispensing" element={<p>Medicine catalog ready</p>}/><Route path="/two-options" element={<p>Unexpected repeated selection</p>}/></Routes></VoiceAssistantProvider></SpeechProvider></HealthProvider></MemoryRouter>));await act(wait);
 await click(/Medicine|medicine|Buy items/i);
 await input('visitor-name','Asha');await click(/Continue|continue/);
 await input('visitor-age','30');await click(/^Female$/i);await click(/Continue|continue/);
 assert(document.body.textContent.includes('Medicine catalog ready'),'medicine opens catalog directly without repeated service chooser');
 assert(!document.querySelector('[aria-label="PIN keypad"]'),'medicine never requests a health profile PIN');
 assert(calls.some(c=>c.path.endsWith('/service')&&c.body.serviceType==='MEDICINE'&&c.body.pairingToken==='test-pair'),'medicine selection reaches backend with pairing token');
 assert(!calls.some(c=>c.path.includes('health-profile')),'medicine never creates or opens a private health profile');
 await act(async()=>root.unmount());output.textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>output.textContent=checks.join('\n')+'\nFAIL '+e.stack);
