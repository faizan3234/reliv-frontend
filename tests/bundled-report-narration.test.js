import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bundledReportNarration } from '../src/voice/bundledReportNarration.js';
import { calc_fat_percent } from '../src/utils/bodyComposition.js';
import { numberParts } from '../src/voice/reportAudio.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../public/assets/audio/manifest.json',import.meta.url)));
const sample={scanCount:4,patient:{age:32,gender:'male'},vitals:{height:172.3,weight:65.4,impedance:500,systolic:138,diastolic:77,bpm:72,oxygen:98,temperature:98.4}};
test('every automatic report phrase has an offline recording in each language',()=>{
 for(const lang of ['en','hi','bn'])for(let page=1;page<=5;page++)for(const scanCount of [1,4,7]) {
  for(const item of bundledReportNarration({...sample,scanCount},page,lang))assert.ok(typeof manifest[item.text]==='string' || manifest[item.text]?.[lang],`${lang}: ${item.text}`);
 }
});
test('report narration changes with the actual reading and retained scan count',()=>{
 const text=data=>bundledReportNarration(data,3,'en').map(x=>x.text);
 assert.notDeepEqual(text(sample),text({...sample,vitals:{...sample.vitals,systolic:121}}));
 assert.ok(!text(sample).includes('Scan'),'vitals page does not repeat visit number');
});
test('body fat narration uses the visible report formula',()=>{
 const spoken=bundledReportNarration(sample,2,'en').map(x=>x.text);
 const expected=numberParts(Math.round(calc_fat_percent(65.4,172.3,1,32,500)*10)/10,'en');
 const i=spoken.indexOf('Body fat estimate');
 assert.ok(i>=0);
 assert.deepEqual(spoken.slice(i+1,i+1+expected.length),expected);
});
