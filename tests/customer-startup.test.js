import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('HTML startup shows progress and retry without a React bundle, then cleans up',async()=>{
 const html=await readFile(new URL('../customer-web/index.html',import.meta.url),'utf8');
 const timers=new Map();
 const dom=new JSDOM(html,{url:'https://reliv7.vercel.app/',runScripts:'dangerously',beforeParse(window){window.setTimeout=(fn,ms)=>{timers.set(ms,fn);return ms;};window.clearTimeout=id=>timers.delete(id);}});
 try{
  const d=dom.window.document;
  assert.ok(d.querySelector('#reliv-boot'));assert.equal(d.querySelector('#reliv-boot-retry').hidden,true);
  timers.get(3500)();assert.match(d.querySelector('#reliv-boot-message').textContent,/Still loading/);
  timers.get(12000)();assert.equal(d.querySelector('#reliv-boot-retry').hidden,false);
  assert.match(d.querySelector('#reliv-boot-help').textContent,/do not pay again/);
  dom.window.relivBootReady();assert.equal(d.querySelector('#reliv-boot'),null);assert.equal(timers.size,0);
  dom.window.dispatchEvent(new dom.window.Event('offline'));
 }finally{dom.window.close();}
});
