import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import PayAd from '../src/pages/PayAd';
window.IS_REACT_ACT_ENVIRONMENT=true;
Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Mozilla Android 14; Pixel; wv) Version/4.0 Chrome/130 Mobile'});
let root,options,opened=0,closed=0,paid=false;const calls=[],checks=[];
const result=document.getElementById('results'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const json=data=>({ok:true,status:200,json:async()=>data});
window.fetch=async(url,options={})=>{
 const body=JSON.parse(options.body||'{}');calls.push({url:String(url),body});
 if(String(url).endsWith('/create-order'))return json({requestId:'same-request',orderId:'same-order',amount:1700,keyId:'rzp_test_fixture',serviceType:'MEDICINE',...(paid?{status:'PAID',paid:true,confirmationCode:'0042'}:{})});
 return json({});
};
window.Razorpay=class{constructor(value){options=value;}on(){}open(){opened++;}close(){closed++;options.modal.ondismiss();}};
function assert(ok,message){if(!ok)throw Error(message);checks.push('PASS '+message);}
async function flush(){await act(async()=>wait(15));}
async function run(){
 localStorage.clear();sessionStorage.clear();window.history.replaceState(null,'','/pay#p=single-scan');root=createRoot(document.getElementById('app'));await act(async()=>root.render(<PayAd/>));await flush();
 const link=document.querySelector('a[href^="intent:"]');assert(link,'Android scanner offers Chrome escape before checkout');assert(link.getAttribute('href').includes('/pay#p=single-scan#Intent;'),'same QR carried in Chrome intent');
 const pay=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Pay ₹'));await act(async()=>{pay.click();pay.click();});await flush();assert(opened===1,'double tap opens only one checkout');
 assert(!document.querySelector('a[href^="intent:"]'),'browser switch unavailable while checkout is active');
 await act(async()=>options.modal.ondismiss());await flush();assert(calls.filter(c=>c.url.endsWith('/create-order')).length===2,'dismiss rechecks payment before another Pay');assert(calls.every(c=>!c.body.package||c.body.package==='single-scan'),'retry uses original QR without rescanning');
 const payAgain=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Pay ₹'));await act(async()=>payAgain.click());await flush();paid=true;await act(async()=>options.modal.ondismiss());await flush();
 assert(document.body.textContent.includes('0042'),'payment completed in app is recovered after returning');assert(opened===2,'recovery does not launch another payment');assert(!document.querySelector('a[href^="intent:"]'),'paid code page does not suggest another checkout');
 await act(async()=>root.unmount());
 paid=false;window.history.replaceState(null,'','/pay#p=another-scan');root=createRoot(document.getElementById('app'));await act(async()=>root.render(<PayAd/>));await flush();
 const lastPay=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Pay ₹'));await act(async()=>lastPay.click());await flush();
 await act(async()=>root.unmount());assert(closed===1,'unmount disposes an active checkout without duplicating dismissals');result.textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{result.textContent=checks.join('\n')+'\nFAIL '+e.stack;});
