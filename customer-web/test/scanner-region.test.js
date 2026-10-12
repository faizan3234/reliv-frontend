import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import Scanner from '../src/services/paymentScannerEngine.js';
import {densePaymentScanRegion} from '../src/services/scannerTuning.js';
test('real scanner adapter refreshes full capture after resolution/orientation changes and cleans up',async()=>{
 const dom=new JSDOM('<video></video>',{pretendToBeVisual:true,url:'https://reliv7.vercel.app'});
 globalThis.window=dom.window;globalThis.document=dom.window.document;
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:dom.window.navigator});
 globalThis.requestAnimationFrame=fn=>dom.window.requestAnimationFrame(fn);
 globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
 globalThis.Worker=class {postMessage(){} terminate(){} addEventListener(){} removeEventListener(){}};
 const video=document.querySelector('video');video.pause=()=>{};
 Object.defineProperty(video,'videoWidth',{configurable:true,value:640});
 Object.defineProperty(video,'videoHeight',{configurable:true,value:480});
 const scanner=new Scanner(video,()=>{}, {calculateScanRegion:densePaymentScanRegion,returnDetailedScanResult:true});
 await scanner._qrEnginePromise;
 assert.equal(scanner._scanRegion.width,640);
 for(const [width,height] of [[1920,1080],[1080,1920]]){
  Object.defineProperty(video,'videoWidth',{configurable:true,value:width});
  Object.defineProperty(video,'videoHeight',{configurable:true,value:height});
  video.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(scanner._scanRegion.width,width);assert.equal(scanner._scanRegion.height,height);
 }
 scanner.destroy();
 Object.defineProperty(video,'videoWidth',{configurable:true,value:320});
 video.dispatchEvent(new dom.window.Event('resize'));
 assert.equal(scanner._scanRegion.width,1080,'destroy removes resize listener');
 dom.window.close();
});
