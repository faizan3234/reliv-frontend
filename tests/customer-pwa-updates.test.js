import test from 'node:test';
import assert from 'node:assert/strict';

test('five-minute update cycle cannot reload checkout or a displayed code', async () => {
  const old={window:global.window,document:global.document,navigator:global.navigator,setInterval:global.setInterval};
  const handlers={};let tick,reloads=0,updates=0,requests=0;
  const registration={update:async()=>{updates++;},waiting:{postMessage:()=>requests++}};
  Object.defineProperty(global,'navigator',{configurable:true,value:{serviceWorker:{addEventListener:(name,cb)=>handlers[name]=cb,register:async()=>registration}}});
  global.window={location:{reload:()=>reloads++},addEventListener:()=>{}};
  global.document={visibilityState:'visible',addEventListener:()=>{}};
  global.setInterval=(callback,ms)=>{tick=callback;assert.equal(ms,300000);};
  try {
    const runtime=await import('../customer-web/src/services/pwaRuntime.js');
    runtime.startPwaUpdates();await Promise.resolve();
    runtime.setAppIdle(false);await tick();
    assert.equal(updates,1);assert.equal(reloads,0);assert.equal(requests,0);
    let answer;handlers.message({data:{type:'RELIV_CAN_UPDATE'},ports:[{postMessage:v=>answer=v}]});assert.equal(answer.idle,false);
    handlers.controllerchange();assert.equal(reloads,0);
    runtime.setAppIdle(true);await tick();assert.equal(requests,1);
    handlers.controllerchange();assert.equal(reloads,1);
    registration.waiting=null;await tick();assert.equal(reloads,2);
  } finally {
    for(const [key,value] of Object.entries(old))Object.defineProperty(global,key,{value,configurable:true,writable:true});
  }
});

test('waiting worker activates only when every app tab reports idle', async()=>{
 const {readFile}=await import('node:fs/promises');const {runInNewContext}=await import('node:vm');
 const listeners={};let consent=[true,false],activated=0,completion;
 class Channel { constructor(){this.port1={close(){}};this.port2={send:value=>this.port1.onmessage({data:value})};} }
 const self={location:{origin:'https://reliv7.vercel.app'},addEventListener:(name,cb)=>listeners[name]=cb,skipWaiting:async()=>activated++,clients:{matchAll:async()=>consent.map(idle=>({postMessage:(_,[port])=>port.send({idle})}))}};
 runInNewContext(await readFile(new URL('../customer-web/public/sw.js',import.meta.url),'utf8'),{self,MessageChannel:Channel,setTimeout,clearTimeout,URL});
 listeners.message({data:{type:'RELIV_ACTIVATE_IF_IDLE'},waitUntil:p=>completion=p});await completion;assert.equal(activated,0);
 consent=[true,true];listeners.message({data:{type:'RELIV_ACTIVATE_IF_IDLE'},waitUntil:p=>completion=p});await completion;assert.equal(activated,1);
});
