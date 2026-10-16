import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import PayAd from '../src/pages/PayAd';
import {MyRecords} from '../customer-web/src/components/MyRecords';
window.IS_REACT_ACT_ENVIRONMENT=true;
const originalError=console.error;let expectedErrors=0;console.error=(...args)=>{if(args.some(a=>String(a?.message||a).includes('Fresh QR appears expired: ask staff to check the kiosk clock.')))expectedErrors++;else originalError(...args);};
const checks=[],result=document.getElementById('results');let clockError=true,root;
const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push('PASS '+message);};
const wait=()=>act(async()=>new Promise(r=>setTimeout(r,15)));
window.fetch=async(url,options={})=>{
 if(String(url).endsWith('/create-order')){
  const p=JSON.parse(options.body).package;
  if(clockError)return{ok:false,status:410,json:async()=>({code:'REQUEST_EXPIRED',message:'Fresh QR appears expired: ask staff to check the kiosk clock.',paymentTiming:{requestId:'r-clock',kioskIssuedAt:1760000000000,kioskExpiresAt:1760000300000,serverNow:1790000000000}})};
  return{ok:true,status:200,json:async()=>({requestId:p,orderId:'order_'+p,amount:1700,keyId:'fixture',serviceType:'MEDICINE'})};
 }
 return{ok:true,status:200,json:async()=>({appReportSync:true})};
};
window.Razorpay=class{on(){}open(){}close(){}};
async function run(){
 localStorage.clear();sessionStorage.clear();root=createRoot(document.getElementById('app'));window.history.replaceState(null,'','/pay#p=old');
 await act(async()=>root.render(<PayAd/>));await wait();
 assert(document.body.textContent.includes('ask staff to check the kiosk clock'),'bridge clock diagnostic survives error rendering');
 assert(!document.body.textContent.includes('Please refresh the QR on the kiosk.'),'generic refresh loop removed');
 assert(document.body.textContent.includes('r-clock'),'timing details retain request reference');
 assert(document.body.textContent.includes('2025-10-09'),'actual kiosk timestamp is visible for staff');
 assert(expectedErrors===2,'only expected expiry errors occurred');
 assert(!document.querySelector('input[type=file]'),'payment never requires a file');
 clockError=false;await act(async()=>{window.history.replaceState(null,'','/pay#p=fresh');window.dispatchEvent(new HashChangeEvent('hashchange'));});await wait();
 assert(document.body.textContent.includes('Pay ₹'),'new valid QR replaces expired error without stale state');
 assert(!document.body.textContent.includes('r-clock'),'old timing diagnostics cleared on fresh QR');
 await act(async()=>root.render(<MyRecords/>));await wait();assert(!document.body.textContent.includes('My saved health records'),'empty vault does not show unrelated records section even with flag on');
 await act(async()=>root.unmount());result.textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{result.textContent=checks.join('\n')+'\nFAIL '+e.stack;});
