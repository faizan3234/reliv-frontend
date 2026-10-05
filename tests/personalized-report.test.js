import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPersonalizedReport, displayedReportScore, personalizedActions} from '../src/voice/personalizedReport.js';
import {personalizedReportCopy} from '../src/voice/personalizedReportCopy.js';
import {reportInsights} from '../src/utils/reportInsights.js';
import {metricCopy, insightCopy} from '../src/voice/insightCopy.js';
const patient={age:30,gender:'male'};
const vitals={height:180,weight:70,systolic:118,diastolic:76,oxygen:98,bpm:72,temperature:98.4};
const data={patient,vitals,scanCount:1};
const manifest=JSON.parse(fs.readFileSync(new URL('../public/assets/audio/manifest.json',import.meta.url)));
for(const language of ['en','hi','bn']) {
 test(language+': each page is distinct, uses actual readings and has local recordings',()=>{
  const pages=[1,2,3,4,5].map(page=>buildPersonalizedReport({data,page,language,score:98}));
  assert.equal(new Set(pages.map(p=>JSON.stringify(p))).size,5);
  const c=personalizedReportCopy[language];
  assert.equal(pages[0][pages[0].indexOf(c.score)+1],'98');
  assert.ok(!pages[0].includes('85')); assert.ok(!pages[0].includes('82'));
  const changed=buildPersonalizedReport({data:{...data,vitals:{...vitals,oxygen:91}},page:2,language});
  assert.notDeepEqual(changed,pages[1]);assert.ok(changed.includes('91'));assert.ok(changed.includes(insightCopy[language].urgentAdvice));
  for(const page of pages) for(const text of page){const e=manifest[text];const f=typeof e==='string'?e:e?.[language]?.file;assert.ok(f,`Missing ${language} recording: ${text}`);assert.ok(fs.existsSync(new URL(`../public/assets/audio/${language}/${f}`,import.meta.url)));}
 });
 test(language+': summary does not declare missing/child readings healthy',()=>{
  for(const x of [{},{patient:{age:12},vitals:{oxygen:98}}]){
   const parts=buildPersonalizedReport({data:x,page:5,language});assert.ok(parts.includes(personalizedReportCopy[language].noAssessment));assert.ok(!parts.includes(personalizedReportCopy[language].noFlags));
  }
 });
 test(language+': comparisons use matching earlier scans, signed direction and actual units',()=>{
  const history=[{...vitals,oxygen:99,scanNumber:1},{...vitals,oxygen:null,scanNumber:2},{...vitals,scanNumber:3}];
  const parts=buildPersonalizedReport({data:{...data,scanCount:3,history},page:4,field:'oxygen',language});
  const index=parts.indexOf(personalizedReportCopy[language].lower);assert.ok(index>0);assert.equal(parts[index+1],'1');
  assert.ok(parts.includes('99'));assert.ok(parts.includes('98'));
  assert.ok(!buildPersonalizedReport({data,page:4,field:'oxygen',language}).includes(personalizedReportCopy[language].lower));
 });
}
test('score has no fallback and uses the same value as the UI including zero',()=>{
 assert.equal(displayedReportScore(data,98),98);assert.equal(displayedReportScore(data,0),0);
 for(const score of [null,undefined,'',NaN,101])assert.equal(displayedReportScore(data,score),null);
 assert.equal(displayedReportScore({},98),null);assert.equal(displayedReportScore({...data,patient:{}},98),null);
});
test('specific recommendations are selected only for actual concerns, and urgent help takes priority',()=>{
 assert.deepEqual(personalizedActions(reportInsights(data),'en'),[]);
 const m=reportInsights({...data,vitals:{...vitals,systolic:155}});
 assert.deepEqual(personalizedActions(m,'en'),[personalizedReportCopy.en.bp]);
 const urgent=reportInsights({...data,vitals:{...vitals,oxygen:88,systolic:155}});
 assert.deepEqual(personalizedActions(urgent,'en'),[insightCopy.en.urgentAdvice]);
 const p=buildPersonalizedReport({data:{...data,vitals:{...vitals,oxygen:88}},page:5});
 assert.ok(p.indexOf(insightCopy.en.urgentAdvice)<p.indexOf(metricCopy.oxygen[0][0]));
});

for(const language of ['en','hi','bn']) {
 test(`${language}: graph narration reads only real earlier scans once in visit order`,()=>{
  const history=[
   {scanNumber:1,systolic:120,diastolic:80,oxygen:97,bpm:70,temperature:98.2,weight:68},
   {scanNumber:2,systolic:125,diastolic:82,oxygen:null,bpm:72,temperature:98.6,weight:67},
   {scanNumber:3,systolic:118,diastolic:76,oxygen:99,bpm:74,temperature:98.4,weight:66},
  ];
  const parts=buildPersonalizedReport({data:{patient,vitals,reportScanNumber:3,history},page:4,language});
  const c=personalizedReportCopy[language];
  const first=parts.indexOf('1'),second=parts.indexOf('2');
  assert.ok(first>0&&second>first,'earlier scans are spoken in order');
  assert.ok(parts.includes('120')&&parts.includes('125')&&parts.includes('97'));
  assert.ok(!parts.includes('118')&&!parts.includes('99'),'current scan values from prior-looking history are excluded');
  assert.equal(parts.filter(x=>x===c.noEarlier).length,0,'available history is not called unavailable');
  assert.equal(parts.filter(x=>x===c.pages[3]).length,1,'page introduction is not repeated per scan');
  const scanTwo=parts.slice(second);assert.ok(!scanTwo.includes('97'),'a missing measurement is skipped, never carried forward');
  for(const text of parts){const entry=manifest[text];const file=typeof entry==='string'?entry:entry?.[language]?.file;assert.ok(file,`Missing offline ${language} audio: ${text}`);}
 });
}

test('graph narration includes historical body fat and water only when recorded or calculable',()=>{
 const history=[
  {scanNumber:1,weight:70,height:180,bodyFat:27.1,bodyWater:51.2,patient},
  {scanNumber:2,weight:69,height:180,bodyFat:null,bodyWater:null,patient},
  {scanNumber:3,...vitals,bodyFat:24,bodyWater:54,patient},
 ];
 const parts=buildPersonalizedReport({data:{...data,reportScanNumber:3,history},page:4,language:'en'});
 assert.ok(parts.includes('27')&&parts.includes('51')&&parts.includes('point'));
 assert.ok(parts.includes('1')&&parts.includes('2'));
 assert.ok(parts.includes('Body fat estimate')&&parts.includes('Body water share'));
 assert.ok(!parts.includes('24')&&!parts.includes('54'),'today values are not read again');
});

test('summary highlights an actual new positive without repeating the scan heading',()=>{
 for(const language of ['en','hi','bn']){
  const old={...vitals,oxygen:93,scanNumber:1};
  const parts=buildPersonalizedReport({data:{...data,scanCount:2,history:[old]},page:5,language});
  const i=['en','hi','bn'].indexOf(language);
  assert.ok(parts.includes(metricCopy.oxygen[0][i]));
  assert.ok(parts.includes('98'));
  const missing=buildPersonalizedReport({data:{},page:5,language});
  assert.equal(missing.filter(text=>text===personalizedReportCopy[language].noAssessment).length,1);
 }
});
