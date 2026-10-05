import test from 'node:test';
import assert from 'node:assert/strict';
import {storyFields,storyLayouts} from '../customer-web/src/components/storyLayout.js';
test('selected templates bind verified score/highlight only to their owner',()=>{
 for(const relationship of ['solo','friends','couple']){
  const fields=storyFields({alias:'Asha',partner:'Sam',relationship},{score:98,name:'Asha',win:'Healthy BMI'});
  assert.equal(fields.name,'Asha');assert.equal(fields.score,'98');assert.equal(fields.partnerScore,'—');
  assert.equal(fields.win,relationship==='solo'?'Healthy BMI':'Asha: Healthy BMI');
  assert.ok(storyLayouts[relationship]);
 }
 assert.equal(storyFields({relationship:'solo'},null).score,'—');
 assert.equal(storyFields({relationship:'solo'},{score:Infinity}).score,'—');
 assert.equal(storyFields({relationship:'solo'},{score:0}).score,'0');
});
