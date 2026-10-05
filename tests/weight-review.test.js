import test from 'node:test';
import assert from 'node:assert/strict';
import {weightReference} from '../src/utils/weightReference.js';
import {weightGuidance} from '../src/voice/weightGuidance.js';
import {reviewCopy} from '../src/voice/reviewGuidance.js';
import {compositionGuidance,supportsMetricNarration} from '../src/voice/bundledReportNarration.js';
import {getScanCount} from '../src/utils/reportSnapshot.js';
const patient={age:30,gender:'male'},vitals={height:180,weight:90};
test('weight ranges and gaps use the actual height and weight, including missing/young patients',()=>{
 assert.deepEqual(weightReference({patient,vitals}),{lower:59.9,upper:81,weight:90,direction:'above',gap:9});
 assert.equal(weightReference({patient,vitals:{...vitals,weight:50}}).direction,'below');
 assert.equal(weightReference({patient,vitals:{...vitals,weight:70}}).direction,'within');
 assert.equal(weightReference({patient:{age:16},vitals}),null);assert.equal(weightReference({patient,vitals:{weight:90}}),null);
 for(const lang of ['en','hi','bn']){const parts=weightGuidance({patient,vitals},lang);assert.ok(parts.includes(reviewCopy[lang].above));assert.ok(parts.includes('9'));}
});
test('composition changes compare only this profile’s prior comparable data',()=>{
 const data={patient,vitals,reportScanNumber:7,scanCount:3,history:[{scanNumber:6,patient,...vitals,weight:80},{scanNumber:7,patient,...vitals}]};
 assert.equal(getScanCount(data),7);
 for(const lang of ['en','hi','bn']){
  const parts=compositionGuidance(data,lang);assert.ok(parts.includes(reviewCopy[lang].previous));assert.ok(parts.includes(reviewCopy[lang].trendLimit));
  assert.ok(!compositionGuidance({...data,history:[]},lang).includes(reviewCopy[lang].previous));
  assert.ok(!compositionGuidance({...data,history:[{scanNumber:6,...vitals}]},lang).includes(reviewCopy[lang].previous));
 }
 assert.equal(supportsMetricNarration('cellularAge'),false);assert.equal(supportsMetricNarration('standardWeight'),true);
});
