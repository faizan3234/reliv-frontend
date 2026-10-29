import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import WifiSettings from '../src/pages/WifiSettings';
window.IS_REACT_ACT_ENVIRONMENT=true;
const results=[];const assert=(ok,text)=>{if(!ok)throw new Error(text);results.push('PASS '+text);};
const flush=()=>act(async()=>new Promise(resolve=>setTimeout(resolve,25)));
let root,requests=[],resolveConnect;
window.fetch=async(url,options={})=>{
 requests.push({url:String(url),options});
 const result=data=>({ok:true,status:200,json:async()=>data});
 if(String(url).endsWith('check-login'))return result({ok:true,token:'a'.repeat(64),expiresAt:Date.now()+60000});
 if(String(url).endsWith('/status'))return result({success:true,status:{ssid:'RELIV-KIOSK',ip:'192.168.50.1',singleAdapter:true,operation:{phase:'idle'}}});
 if(String(url).endsWith('/scan'))return result({success:true,networks:[{ssid:'My phone',signal:90,security:'WPA2',supported:true}]});
 if(String(url).endsWith('/connect'))return new Promise(resolve=>{resolveConnect=()=>resolve(result({success:true,operation:{phase:'scheduled',singleAdapter:true,ssid:'My phone',returnsAt:Date.now()+300000}}));});
 return result({success:true});
};
async function run(){
 root=createRoot(document.getElementById('app'));await act(async()=>root.render(<WifiSettings/>));await flush();
 assert(document.body.textContent.includes('Sign in to manage Wi-Fi'),'admin sign-in is required');assert(requests.length===0,'no Wi-Fi data fetched before sign-in');
 await act(async()=>root.unmount());sessionStorage.setItem('reliv_admin_session',JSON.stringify({token:'a'.repeat(64),expiresAt:Date.now()+60000}));
 root=createRoot(document.getElementById('app'));await act(async()=>root.render(<WifiSettings/>));await flush();
 assert(document.body.textContent.includes('RELIV-KIOSK'),'actual network shown');
 assert(requests.every(item=>item.options.headers.Authorization==='Bearer '+'a'.repeat(64)),'Wi-Fi reads include admin credentials');
 const join=()=>[...document.querySelectorAll('button')].find(item=>item.textContent.includes('Connect Pi'));
 assert(join().disabled,'acknowledgement required before switching');
 await act(async()=>document.querySelector('.wifi-network').click());
 assert(document.querySelector('input[autocomplete="off"]').value==='My phone','network selection fills SSID');
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
 await act(async()=>{const input=document.querySelector('input[type=password]');setter.call(input,'testpassword');input.dispatchEvent(new Event('input',{bubbles:true}));const checks=document.querySelectorAll('input[type=checkbox]');checks[checks.length-1].click();});
 assert(!join().disabled,'ready after idle confirmation');
 const form=document.querySelector('form');await act(async()=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 assert(requests.filter(item=>item.url.endsWith('/connect')).length===1,'duplicate submission sends one request');
 await act(async()=>resolveConnect());await flush();assert(document.body.textContent.includes('Maintenance in progress'),'accepted request is pending, not fake connected');
 assert(document.body.textContent.includes('Automatic return:'),'deadline visible');
 assert(!JSON.stringify({...localStorage,...sessionStorage}).includes('testpassword'),'Wi-Fi password not persisted in browser');
 await act(async()=>root.unmount());document.querySelector('#results').textContent=results.join('\n')+'\nALL '+results.length+' BROWSER CHECKS PASSED';
}
run().catch(error=>{document.querySelector('#results').textContent=results.join('\n')+'\nFAIL '+error.stack;});
