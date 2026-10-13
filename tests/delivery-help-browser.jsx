import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import DeliveryHelp from '../src/components/DeliveryHelp';
import {DeliverySupport} from '../customer-web/src/components/DeliverySupport';
window.IS_REACT_ACT_ENVIRONMENT=true;
const checks=[],out=document.getElementById('results');
const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push('PASS '+message);};
async function click(text){const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text));if(!b)throw Error('Missing '+text);await act(async()=>b.click());}
async function run(){
 const root=createRoot(document.getElementById('app'));let calls=0,release;
 localStorage.setItem('reliv_session_id','KSK-TEST');localStorage.setItem('reliv_pairing_token','a'.repeat(64));
 window.fetch=async(url,opts)=>{calls++;assert(JSON.parse(opts.body).pairingToken==='a'.repeat(64),'request uses original session pairing');return new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({ok:true,case:{case_id:'HELP-TEST'}})});});};
 await act(async()=>root.render(<DeliveryHelp sessionId="KSK-TEST"/>));await click('Did not receive');
 assert(calls===0,'opening help does not submit anything');assert(document.body.textContent.includes('9163606455'),'contact visible before network request');
 await click('Save help');await click('…');assert(calls===1,'rapid taps do not duplicate submission');
 await act(async()=>{release();await new Promise(r=>setTimeout(r,10));});assert(document.body.textContent.includes('HELP-TEST'),'durable case reference displayed');
 assert(document.body.textContent.includes('does not send a WhatsApp'),'offline save is not presented as a sent message');
 await act(async()=>root.render(<DeliveryHelp key="second" sessionId="KSK-OTHER"/>));await click('Did not receive');await click('Save help');
 assert(calls===1,'different session cannot reuse another pairing token');assert(document.body.textContent.includes('Could not save locally'),'failed saving keeps contact fallback');
 await act(async()=>root.render(<DeliverySupport requestId="REQ-TEST"/>));
 const wa=document.querySelector('a[href^="https://wa.me/"]');assert(wa.href.startsWith('https://wa.me/919163606455?'),'phone support uses India WhatsApp number');assert(decodeURIComponent(wa.href).includes('REQ-TEST'),'phone message includes payment request reference');
 assert(!decodeURIComponent(wa.href).includes('a'.repeat(64)),'contact link contains no pairing token');
 await act(async()=>root.unmount());out.textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>out.textContent=checks.join('\n')+'\nFAIL '+e.stack);
