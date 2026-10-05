import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import PayAd from '../src/pages/PayAd';
import {savePaymentRecovery,savePendingVerification,getPendingVerification} from '../customer-web/src/services/session';
window.IS_REACT_ACT_ENVIRONMENT=true;
let root,resolveOld; const calls=[],checks=[];
const result=document.getElementById('results'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const json=data=>({ok:true,status:200,json:async()=>data});
window.fetch=async(url,options={})=>{
 const body=JSON.parse(options.body||'{}'); calls.push({url:String(url),body});
 if(String(url).endsWith('/create-order')){
  if(body.package==='slow')return new Promise(resolve=>{resolveOld=()=>resolve(json({requestId:'slow',orderId:'order_slow',status:'PAID',confirmationCode:'1111'}));});
  return json({requestId:body.package,orderId:'order_'+body.package,amount:1700,keyId:'rzp_test_fixture',serviceType:body.package==='ad'?'AD_CAMPAIGN':'HEALTH_CHECKUP',...(body.package==='paid'?{status:'PAID',confirmationCode:'0042',storySummary:{name:'Asha',score:98,scanNumber:3,win:'Good oxygen level'}}:{})});
 }
 if(String(url).endsWith('/verify-payment'))return json({paid:true,requestId:body.requestId,confirmationCode:'0088',storySummary:{name:'Asha',score:98,scanNumber:3,win:'Good oxygen level'}});
 if(String(url).endsWith('/email-health-report'))return json({ok:true,sent:true,downloadToken:'test-token',scanNumber:3,totalScans:3});
 if(String(url).endsWith('/recover-payment'))return json({paid:true,requestId:body.requestId,confirmationCode:'0042'});
 return json({});
};
function assert(ok,message){if(!ok)throw new Error(message);checks.push('PASS '+message);}
async function flush(){await act(async()=>wait(15));}
async function mount(pkg){if(root)await act(async()=>root.unmount());window.history.replaceState(null,'','/pay#p='+pkg);root=createRoot(document.getElementById('app'));await act(async()=>root.render(<PayAd/>));await flush();}
async function scan(pkg){await act(async()=>{window.history.replaceState(null,'','/pay#p='+pkg);window.dispatchEvent(new HashChangeEvent('hashchange'));});await flush();}
async function run(){
 localStorage.clear();sessionStorage.clear();
 savePaymentRecovery({requestId:'paid',encryptedPackage:'paid',amount:1700});
 savePendingVerification({requestId:'paid',orderId:'order_paid',paymentId:'pay_old',signature:'old-signature'});
 await mount('new');
 assert(!calls.some(c=>c.url.endsWith('/verify-payment')||c.url.endsWith('/recover-payment')),'new QR never verifies or recovers previous payment');
 assert(!document.body.textContent.includes('0042')&&!document.body.textContent.includes('0088'),'new unpaid QR does not reveal old activation code');
 assert(getPendingVerification('paid')?.paymentId==='pay_old','old pending proof preserved for its own QR');
 assert(!getPendingVerification('new'),'pending proof is request-scoped');
 await mount('paid');assert(document.body.textContent.includes('0088'),'same request recovers its pending callback');
 assert(document.body.textContent.includes('Your Reliv share card'),'share card is directly below the paid kiosk code');
 const nameInput=document.querySelector('[aria-label="Name to show on the card"]');assert(nameInput,'customer can easily edit the name shown on the card');
 assert(nameInput.value==='Asha','card name is prefilled from this paid check-in');
 assert(window.__renderedCanvasText?.includes('Asha')&&window.__renderedCanvasText?.includes('98')&&window.__renderedCanvasText?.includes('Good oxygen level'),'live card preview uses the paid name, score and actual highlight');
 const consent=document.querySelector('[aria-label="Optional Reliv story card"] input[type="checkbox"]');await act(async()=>consent.click());await flush();
 const save=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save card image'));assert(save&&!save.disabled,'card can be saved immediately even while artwork is loading');await act(async()=>save.click());await flush();
 assert(window.__downloadedCard==='Reliv-Together.png','customer can save the generated card image');
 const email=document.querySelector('input[type="email"]');await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(email,'asha@example.com');email.dispatchEvent(new Event('input',{bubbles:true}));});await flush();
 const send=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Send My Health Report'));await act(async()=>send.click());await flush();
 const mailCall=calls.find(c=>c.url.endsWith('/email-health-report'));assert(mailCall?.body.storyCard?.alias==='Asha'&&mailCall.body.storyCard.consent===true,'report email includes the opted-in card for the backend PNG attachment');
 await scan('ad');assert(!document.body.textContent.includes('0088')&&document.body.textContent.includes('Advertising'),'hash navigation clears prior success and uses ad order');
 await scan('slow');await scan('newer');await act(async()=>resolveOld());await flush();
 assert(!document.body.textContent.includes('1111'),'late old-QR response cannot reveal a code on new QR');
 assert(calls.at(-1).body.package==='newer','current QR is the authoritative package');
 await scan('paid');assert(document.body.textContent.includes('0042'),'server-paid current QR reveals leading-zero code');
 await mount('paid');assert(document.body.textContent.includes('0042'),'refresh reopens the same paid request');
 assert(!localStorage.getItem('reliv_payment_recovery_v2')?.includes('0042'),'activation code never persisted');
 await act(async()=>root.unmount());result.textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{result.textContent=checks.join('\n')+'\nFAIL '+e.stack;});
