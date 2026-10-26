import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {HealthProvider,useHealth} from '../src/context/HealthContext';
import {SpeechProvider} from '../src/context/SpeechContext';
import MedicineDispensing,{getAvailableQuantity,getMedicineImageUrl} from '../src/pages/MedicineDispensing';
window.IS_REACT_ACT_ENVIRONMENT=true;
const wait=window.setTimeout.bind(window);let poll,health;
const interval=window.setInterval.bind(window);
window.setInterval=(fn,ms)=>ms===15000?(poll=fn,-7):interval(fn,ms);
window.speechSynthesis={getVoices:()=>[],cancel(){},addEventListener(){},removeEventListener(){}};
let kits=[{kit_id:'a',name:'Kit A',price:10,quantity:3,reserved_quantity:1},{kit_id:'b',name:'Kit B',price:20,quantity:0},{kit_id:'c',name:'Kit C',price:30,available_quantity:'bad'}];let offline=false;
window.fetch=async url=>{
 if(String(url).endsWith('/api/kits')) {if(offline)throw new Error('offline');return {ok:true,json:async()=>({kits})};}
 return {ok:true,json:async()=>({}),blob:async()=>new Blob(['audio'])};
};
window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
export function Probe(){health=useHealth();return <MedicineDispensing/>;}
const checks=[];const assert=(ok,text)=>{if(!ok)throw new Error(text);checks.push('PASS '+text);};
const flush=()=>act(async()=>new Promise(r=>wait(r,30)));
const card=name=>[...document.querySelectorAll('.commerce-products .glass-card')].find(c=>c.querySelector('h3').textContent===name);
const checkout=()=>document.querySelector('.commerce-summary .commerce-primary');
const click=async button=>{assert(button,'control exists');await act(async()=>button.click());await flush();};
async function run(){
 assert(getMedicineImageUrl({image_path:'/medicine-images/item.png'}).endsWith('/api/medicine-images/item.png'),'medicine and admin image helper uses nginx API proxy');
 sessionStorage.clear();const root=createRoot(document.getElementById('app'));
 await act(async()=>root.render(<MemoryRouter><HealthProvider><SpeechProvider><Routes><Route path="/" element={<Probe/>}/><Route path="/checkout" element={<p id="checkout-page">Review order</p>}/></Routes></SpeechProvider></HealthProvider></MemoryRouter>));await flush();
 assert(card('Kit A').textContent.includes('2 available'),'display available stock after reservations');
 assert(card('Kit B').textContent.includes('Out of stock · 0')&&card('Kit B').querySelector('button').disabled,'zero stock remains visible and disabled');
 assert(card('Kit C').querySelector('button').disabled&&getAvailableQuantity({quantity:Infinity})===0,'invalid stock cannot be purchased');
 await click(card('Kit A').querySelector('.add-cart-btn'));await click(card('Kit A').querySelector('.card-qty-plus'));
 assert(card('Kit A').querySelector('.card-qty-plus').disabled,'card quantity cannot exceed stock');
 assert(document.querySelector('.commerce-summary').textContent.includes('2 × Kit A'),'summary reflects selected quantity');
 kits=[{...kits[0],available_quantity:1},kits[1],kits[2]];await act(async()=>poll());await flush();
 assert(card('Kit A').textContent.includes('1 available'),'automatic refresh updates actual count');
 await click(checkout());assert(!document.querySelector('#checkout-page')&&document.body.textContent.includes('Stock changed'),'stock decrease requires review, never silently navigates');
 assert(card('Kit A').querySelector('.card-qty-value').textContent==='1','checkout clamps selection to newly available stock');
 offline=true;await click(document.querySelector('.stock-refresh'));
 assert(checkout().disabled&&document.querySelector('[role="alert"]').textContent.includes('Stock could not'),'offline inventory blocks checkout with selection-specific guidance');
 offline=false;kits=[{...kits[0],available_quantity:0},kits[1],kits[2]];await click(document.querySelector('.stock-refresh'));
 assert(card('Kit A').querySelector('.add-cart-btn').disabled,'stock dropping to zero disables item immediately after refresh');
 await click(checkout());await act(async()=>new Promise(r=>wait(r,500)));assert(JSON.parse(sessionStorage.getItem('reliv_cart')).length===0&&!document.querySelector('#checkout-page'),'sold-out selection removed for review, without payment navigation');
 kits=[{...kits[0],available_quantity:2},kits[1],kits[2]];await click(document.querySelector('.stock-refresh'));
 await act(async()=>health.update({language:'hi'}));await flush();assert(card('Kit A').textContent.includes('2 उपलब्ध हैं'),'Hindi stock count is localized');
 await act(async()=>health.update({language:'bn'}));await flush();assert(card('Kit A').textContent.includes('2টি পাওয়া যাচ্ছে'),'Bengali stock count is localized');
 await click(card('Kit A').querySelector('.add-cart-btn'));await click(checkout());assert(document.querySelector('#checkout-page'),'valid stock proceeds to order review');
 await act(async()=>root.unmount());document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>{document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+e.stack;});
