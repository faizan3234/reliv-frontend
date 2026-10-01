import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryState } from '../src/voice/medicineGuide.js';
import { reportNarration } from '../src/voice/reportQuestions.js';
test('delivery requires paid local session and all confirmed jobs; route state cannot fake it',()=>{
 const base={ok:true,sessionId:'S',serviceType:'MEDICINE',paymentVerified:true,status:'dispense_complete',dispenseStatus:'COMPLETED',jobsCount:2,jobsCompleted:2};
 assert.equal(deliveryState(base,'S'),'complete');
 assert.equal(deliveryState({...base,jobsCompleted:1},'S'),'dispensing');
 assert.equal(deliveryState({...base,jobsCount:0,jobsCompleted:0},'S'),'waiting');
 assert.equal(deliveryState({...base,paymentVerified:false},'S'),'unknown');
 assert.equal(deliveryState(base,'OTHER'),'unknown');
 assert.equal(deliveryState({...base,dispenseStatus:'MANUAL_REVIEW_REQUIRED'},'S'),'review');
});
test('report narration includes measured values and localized missing data, never substitute values',()=>{
 const data={vitals:{systolic:120,diastolic:80,oxygen:98,temperature:null}};
 for(const lang of ['en','hi','bn']) {
  const text=reportNarration(data,lang);
  assert.match(text,/120/);assert.match(text,/80/);assert.match(text,/98/);
  assert.ok(!text.includes('98.6'));
 }
 assert.match(reportNarration(data,'en'),/Temperature: not measured/);
 assert.match(reportNarration(data,'hi'),/माप नहीं मिला/);
 assert.match(reportNarration(data,'bn'),/পরিমাপ পাওয়া যায়নি/);
});
