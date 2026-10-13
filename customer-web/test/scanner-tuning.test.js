import test from 'node:test';
import assert from 'node:assert/strict';
import {densePaymentScanRegion,acknowledgePaymentScan,tunePaymentCamera} from '../src/services/scannerTuning.js';
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

test('rejected resolution does not skip supported focus and exposure controls',async()=>{
 const calls=[];
 const track={readyState:'live',getCapabilities:()=>({focusMode:['continuous'],exposureMode:['continuous'],whiteBalanceMode:['manual']}),applyConstraints:async c=>{calls.push(c);if(c.width)throw Error('Unsupported resolution');}};
 await tunePaymentCamera(track);
 assert.equal(calls.length,3);
 assert.deepEqual(calls[1],{advanced:[{focusMode:'continuous'}]});
 assert.deepEqual(calls[2],{advanced:[{exposureMode:'continuous'}]});
 calls.length=0;await tunePaymentCamera(track,{resolution:false});assert.equal(calls.length,2);
 track.readyState='ended';calls.length=0;await tunePaymentCamera(track);assert.equal(calls.length,0);
 await assert.doesNotReject(()=>tunePaymentCamera({applyConstraints:async()=>{},getCapabilities:()=>{throw Error('Not exposed');}}));
});
