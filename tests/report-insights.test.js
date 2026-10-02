import test from 'node:test';
import assert from 'node:assert/strict';
import {bodyEstimates} from '../src/utils/bodyEstimates.js';
import {reportInsights,metricStatus,observationCount,reportRows} from '../src/utils/reportInsights.js';
const patient={age:30,gender:'male'},vitals={height:180,weight:70,systolic:120,diastolic:80,oxygen:98,bpm:72,temperature:98.4};
test('documented adult estimates use actual inputs and exclude unsupported health ages',()=>{
 const e=bodyEstimates(vitals,patient);assert.equal(e.bmi,21.6);assert.equal(e.bodyFat,16.6);assert.equal(e.bodyWaterLitres,42.6);assert.equal(e.restingEnergy,1680);
 assert.equal(reportInsights({vitals,patient}).filter(x=>x.value!==null).length,16);
 assert.ok(!('metabolicAge' in e)&&!('visceralFat' in e));
 assert.deepEqual(bodyEstimates(vitals,{...patient,age:12}),{});
 assert.deepEqual(bodyEstimates({...vitals,height:null},patient),{});
 assert.equal(bodyEstimates(vitals,{...patient,gender:'other'}).bodyFat,undefined);
});
test('traffic cues use both BP values, age applicability and missing value guards',()=>{
 assert.equal(metricStatus('systolic',118,30,{systolic:118,diastolic:95}),'review');
 assert.equal(metricStatus('diastolic',80,30,{systolic:190,diastolic:80}),'urgent');
 assert.equal(metricStatus('oxygen',92,30),'urgent');assert.equal(metricStatus('oxygen',94,30),'caution');assert.equal(metricStatus('oxygen',98,30),'good');
 assert.equal(metricStatus('oxygen',98,12),'neutral');assert.equal(metricStatus('bodyWater',60,30),'neutral');
 assert.equal(metricStatus('systolic',120,30,{systolic:120}),'neutral');
 assert.equal(reportInsights({vitals:{bodyFat:18,metabolicAge:21},patient}).find(x=>x.key==='bodyFat').value,null);
});
test('observations accumulate only real available values and historical demographics',()=>{
 const data={vitals,patient,scanCount:2,history:[{...vitals,patient},{...vitals,weight:69,patient:{...patient,age:31}}]};
 assert.equal(observationCount(data),32);assert.notEqual(reportRows(data)[0].bodyFat,reportRows(data)[1].bodyFat);
 assert.equal(observationCount({vitals:{oxygen:98},scanCount:20}),1);
 assert.equal(reportRows({patient,scanCount:2,history:[vitals]})[0].bodyFat,undefined);
});
