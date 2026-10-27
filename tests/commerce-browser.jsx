/* eslint-disable react-refresh/only-export-components -- Standalone integration entry, not a hot-reloaded application module. */
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route,useLocation} from 'react-router-dom';
import {HealthProvider} from '../src/context/HealthContext';
import {SpeechProvider} from '../src/context/SpeechContext';
import Checkout from '../src/pages/Checkout';
import Feedback from '../src/pages/feedback';
window.IS_REACT_ACT_ENVIRONMENT=true;
window.speechSynthesis={getVoices:()=>[],cancel(){},addEventListener(){},removeEventListener(){}};
const wait=window.setTimeout.bind(window);let finish,posts=0,fail=false,lastBody;
window.setTimeout=(fn,ms,...args)=>ms===3000?(finish=fn,-5):ms===450?-1:wait(fn,ms,...args);
window.fetch=async(url,options={})=>{if(String(url).endsWith('/api/feedback')){posts++;lastBody=JSON.parse(options.body);if(fail)throw new Error('offline');return {ok:true,json:async()=>({ok:true})};}return {ok:true,json:async()=>({})};};
const checks=[];const assert=(ok,msg)=>{if(!ok)throw new Error(msg);checks.push('PASS '+msg);};
let root;
const flush=()=>act(async()=>new Promise(r=>wait(r,20)));
const click=async text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text));assert(b&&!b.disabled,'enabled control: '+text);await act(async()=>b.click());await flush();};
function Destination(){const l=useLocation();return <pre id="payment">{JSON.stringify(l.state)}</pre>;}
async function mount(path,state,element){if(root)await act(async()=>root.unmount());root=createRoot(document.getElementById('app'));await act(async()=>root.render(<MemoryRouter initialEntries={[{pathname:path,state}]}><HealthProvider><SpeechProvider><Routes><Route path={path} element={element}/><Route path="/payment" element={<Destination/>}/><Route path="/" element={<p id="home">Home</p>}/></Routes></SpeechProvider></HealthProvider></MemoryRouter>));await flush();}
async function run(){
 await mount('/checkout',{cart:[{kit_id:'a',name:'Test Kit',price:32,cartQuantity:1,availableStock:2}]},<Checkout/>);
 assert(document.querySelector('.commerce-total').textContent.includes('32'),'review shows exact item subtotal');
 assert(!document.body.textContent.includes('Launch Price')&&!document.body.textContent.includes('Platform Fee'),'no fabricated discount or optional server fee');
 await click('+');assert(document.querySelector('.commerce-qty button:last-child').disabled,'quantity capped at verified stock');
 await click('Continue to payment');const next=JSON.parse(document.querySelector('#payment').textContent);assert(next.cart[0].cartQuantity===2&&next.totalPrice===64,'payment receives cart; backend remains authoritative for payable total');
 await mount('/feedback',{medicineOrder:true,language:'en'},<Feedback/>);await click('Skip');
 assert(document.body.textContent.includes('Thank you for visiting Reliv.')&&!document.body.textContent.includes('Sanitizing')&&posts===0,'skip shows honest reset without feedback request');
 await act(async()=>finish());assert(document.querySelector('#home'),'animation ends at home');
 await mount('/feedback',{medicineOrder:true,language:'bn'},<Feedback/>);await click('খুব ভালো');fail=true;await click('ফিডব্যাক পাঠান');
 assert(document.querySelector('[role="alert"]'),'offline feedback error recoverable');
 fail=false;await click('ফিডব্যাক পাঠান');assert(lastBody.mood===6,'rating matches backend mood contract');await act(async()=>finish());assert(document.querySelector('#home'),'successful feedback returns home');
 await act(async()=>root.unmount());document.getElementById('results').textContent=checks.join('\n')+'\nALL '+checks.length+' BROWSER CHECKS PASSED';
}
run().catch(e=>document.getElementById('results').textContent=checks.join('\n')+'\nFAIL '+e.stack);
