import test from 'node:test';
import assert from 'node:assert/strict';
import {densePaymentScanRegion,acknowledgePaymentScan} from '../src/services/scannerTuning.js';
test('dense QR sampling matches entire visible frame without losing native detail',()=>{
 for(const [w,h] of [[1920,1080],[1080,1920],[640,480],[3840,2160]]){
  const r=densePaymentScanRegion({videoWidth:w,videoHeight:h});
  assert.equal(r.width,w);assert.equal(r.height,h);
  assert.equal(r.x+r.width/2,w/2);assert.equal(r.y+r.height/2,h/2);
  assert.equal(r.downScaledWidth,Math.round(w*Math.min(1,1920/Math.max(w,h))));
  assert.equal(r.downScaledHeight,Math.round(h*Math.min(1,1920/Math.max(w,h))));
 }
 assert.equal(densePaymentScanRegion({}).width,1);
});
test('one-second haptic remains optional and cannot break payment navigation',()=>{
 const calls=[];acknowledgePaymentScan({vibrate:n=>calls.push(n)});assert.deepEqual(calls,[1000]);
 assert.doesNotThrow(()=>acknowledgePaymentScan({}));
 assert.doesNotThrow(()=>acknowledgePaymentScan({vibrate:()=>{throw Error('Disabled');}}));
});
