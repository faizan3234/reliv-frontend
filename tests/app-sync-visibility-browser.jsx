import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {AppReportSave} from '../customer-web/src/components/AppReportSave';
window.IS_REACT_ACT_ENVIRONMENT=true;
const checks=[],result=document.getElementById('results');let enabled=false,fail=false,exports=0;
window.fetch=async url=>{
 if(String(url).endsWith('/app-record')){exports++;return {ok:true,status:200,json:async()=>({ok:true,record:{version:1,id:'report-1',profileKey:'profile-1',scanNumber:4,vitals:{weight:65},patient:{name:'Test'}}})};}
 if(fail)throw Error('offline');
 return {ok:true,status:200,json:async()=>({appReportSync:enabled})};
};
const wait=()=>act(async()=>new Promise(r=>setTimeout(r,15)));
const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push('PASS '+message);};
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
async function run(){
 const root=createRoot(document.getElementById('app'));await act(async()=>root.render(<AppReportSave encryptedPackage="synthetic"/>));await wait();
 assert(button('Send my health report to my app')?.disabled,'flag off leaves discoverable disabled control');
 assert(document.body.textContent.includes('switched off by Reliv'),'disabled reason explains missing functionality');
 assert(exports===0,'off flag never exports health data');
 enabled=true;await act(async()=>button('Check availability again').click());await wait();
 assert(exports===0,'enabling feature without prior consent does not export');
 assert(!button('Send my health report to my app').disabled,'retry detects live flag enabled without another scan');
 await act(async()=>button('Send my health report to my app').click());await wait();
 assert(document.body.textContent.includes('Scan 4 saved on this phone'),'one tap saves actual scan number without a password');
 assert(!document.querySelector('input[type="password"]'),'saving never asks for a password');
 assert(exports===1,'manual consent makes exactly one export');
 assert(JSON.parse(localStorage.getItem('reliv-device-records-v2')).records.length===1,'record is durable in phone storage');
 localStorage.clear();
 await act(async()=>root.render(<AppReportSave encryptedPackage="next"/>));fail=true;await wait();
 // Explicit next package recheck after transport goes offline.
 await act(async()=>root.render(<AppReportSave encryptedPackage="offline"/>));await wait();
 assert(button('Send my health report to my app').disabled,'network failure cannot leave saving enabled');
 assert(document.body.textContent.includes('temporarily unavailable'),'network failure is visible instead of silently hiding option');
 fail=false;enabled=false;await act(async()=>button('Check availability again').click());await wait();
 assert(document.body.textContent.includes('switched off by Reliv'),'turning flag off restores disabled state');
 assert(!document.body.textContent.includes('Create a private password'),'disabled state hides form');
 await act(async()=>root.unmount());result.textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(error=>{result.textContent=checks.join('\n')+'\nFAIL '+error.stack;});
