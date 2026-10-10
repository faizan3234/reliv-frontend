import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import App from '../customer-web/src/App';
import {savePaidSession,clearPaidSession,getPaidSession,savePaymentRecovery,clearPaymentRecovery} from '../customer-web/src/services/session';
window.IS_REACT_ACT_ENVIRONMENT=true;
const checks=[];let root,orderCalls=0;
const result=document.getElementById('results');
const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push('PASS '+message);};
const flush=()=>act(async()=>new Promise(r=>setTimeout(r,20)));
window.matchMedia=()=>({matches:false});
Object.defineProperty(navigator,'userAgent',{value:'Mozilla Android Chrome',configurable:true});
window.fetch=async()=>{orderCalls++;throw Error('No order request expected for saved paid session');};
async function mount(){root=createRoot(document.getElementById('app'));await act(async()=>root.render(<App/>));await flush();}
async function unmount(){await act(async()=>root.unmount());}
const find=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
async function run(){
 window.history.replaceState(null,'','/');await mount();
 assert(find('Install Reliv'),'Android home has visible install action');
 await act(async()=>find('Install Reliv').click());assert(document.body.textContent.includes('open the ⋮ menu'),'browser without native prompt offers honest install instructions');
 const offer=new Event('beforeinstallprompt',{cancelable:true});let prompted=0;offer.prompt=async()=>{prompted++;};offer.userChoice=Promise.resolve({outcome:'accepted'});
 await act(async()=>window.dispatchEvent(offer));assert(offer.defaultPrevented,'native install offer is retained');
 await act(async()=>{find('Install Reliv').click();find('Install Reliv')?.click();});
 assert(prompted===1,'double tap opens only one native installation confirmation');
 assert(!find('Install Reliv'),'accepted installation hides install button');await unmount();
 Object.defineProperty(navigator,'userAgent',{value:'iPhone Safari',configurable:true});await mount();assert(!find('Install Reliv'),'Android-only install control hidden on iPhone');await unmount();
 const oldNow=Date.now;let now=1000000;Date.now=()=>now;
 try{
   savePaidSession({requestId:'test',encryptedPackage:'only-this-phone',confirmationCode:'0042',amount:1700,serviceType:'MEDICINE'});
   savePaymentRecovery({requestId:'older',encryptedPackage:'different-old-request'});
   window.history.replaceState(null,'','/');await mount();
   assert(document.body.textContent.includes('Payment Successful'),'matching scanned package reopens verified code');
   assert(window.location.hash==='','paid QR removed from URL so expiry cannot recreate it');
   assert(orderCalls===0,'restoring a local confirmed code never creates an order for an older recovery slot');
   clearPaymentRecovery('different-old-request');
   await act(async()=>document.querySelector('[aria-label="Refresh Reliv"]').click());
   assert(document.body.textContent.includes('Your active session stays open safely'),'manual refresh preserves confirmed session');
   now+=240000;await unmount();await mount();
   assert(document.body.textContent.includes('Payment Successful'),'reopen at minute four retains code');
   assert(getPaidSession().expiresAt===1300000,'reopening does not restart five-minute window');
   now+=60000;await act(async()=>document.dispatchEvent(new Event('visibilitychange')));await flush();
   assert(document.body.textContent.includes('No active payment session'),'exact deadline returns to home after resume');
   assert(!getPaidSession()&&window.location.hash==='','expired code removed from memory and URL');
   await unmount();await mount();assert(orderCalls===0,'expired code cannot trigger an order on reopening');await unmount();
 }finally{Date.now=oldNow;clearPaidSession();}
 result.textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{result.textContent=checks.join('\n')+'\nFAIL '+e.stack;});
