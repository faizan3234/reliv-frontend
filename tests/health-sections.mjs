import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const fake = {
 './state/sessionStore': `export const useSessionStore=()=>({state:{isLoaded:true,encryptedPackage:'paid-package',paymentState:'PAYMENT_V2_FLOW'}});`,
 './services/session': `export const extractPaymentPackage=()=>'';export const getPendingVerification=()=>null;export const getPaymentRecovery=()=>null;export const getPaidSession=()=>null;`,
 './services/pwaRuntime': `export const setAppIdle=()=>{};export const checkForAppUpdate=async()=>{};export const refreshApp=()=>{};`,
 './services/scanFeedback': `export const prepareScanSound=()=>{};`,
 './components/InstallApp': `export const InstallApp=()=>null;`,
 './components/Header': `export const Header=()=>null;`,
 './pages/Start/StartPage': `export const StartPage=()=>null;`,
 './pages/Error/ErrorPage': `export const ErrorPage=()=>null;`,
 './pages/PaymentV2/PaymentV2Page': `import React from 'react';export function PaymentV2Page(){React.useEffect(()=>{window.paymentMounts++;},[]);return <p>Kiosk code 1234</p>;}`,
 './components/PaymentScanner': `import React from 'react';export const PaymentScanner=({onClose})=><button onClick={onClose}>Close camera</button>;`,
};
const result=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {App} from './customer-web/src/App.jsx';window.paymentMounts=0;createRoot(document.getElementById('app')).render(<App/>);`,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'dependencies',setup(b){b.onResolve({filter:/.*/},args=>fake[args.path]?{path:args.path,namespace:'fake'}:null);b.onLoad({filter:/.*/,namespace:'fake'},args=>({contents:fake[args.path],loader:'jsx',resolveDir:process.cwd()}));}}]});
const dom=new JSDOM('<div id="app"></div>',{url:'https://reliv7.vercel.app',runScripts:'dangerously',pretendToBeVisual:true});
const records=Array.from({length:7},(_,i)=>({version:1,id:'r'+i,profileKey:'person1',scanNumber:i+1,recordedAt:Date.now(),patient:{name:'Rahul'},vitals:{weight:60+i,temperature:98.4},summary:{score:90+i}}));
records.push({...records[0],id:'other',profileKey:'person2',patient:{name:'Asha'},summary:{score:77}});
dom.window.localStorage.setItem('reliv-device-records-v2',JSON.stringify({version:2,records,autoProfiles:[]}));
dom.window.eval(result.outputFiles[0].text);
const wait=()=>new Promise(r=>setTimeout(r,40));
const button=text=>[...dom.window.document.querySelectorAll('button')].find(b=>b.textContent===text);
await wait();assert.equal(dom.window.paymentMounts,1);
button('My Health').click();await wait();assert.match(dom.window.document.body.textContent,/Scan 7/);
button('Health Records').click();await wait();assert.equal(dom.window.document.querySelectorAll('details').length,7);
assert.match(dom.window.document.body.textContent,/Temperature \(°F\)/);
const select=dom.window.document.querySelector('select');select.value='person2';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await wait();assert.equal(dom.window.document.querySelectorAll('details').length,1);
button('Scan QR').click();await wait();assert.ok(button('Close camera'));
button('Health Records').click();await wait();assert.equal(button('Close camera'),undefined);
button('Return to payment / kiosk code').click();await wait();assert.equal(dom.window.paymentMounts,1);
assert.equal(JSON.parse(dom.window.localStorage.getItem('reliv-device-records-v2')).records.length,8);
dom.window.close();console.log('PASS: sections, seven scans, profile separation, temperature units, camera cleanup, payment preservation and no record deletion');
