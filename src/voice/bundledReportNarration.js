import { calc_fat_percent, calc_fat_mass, calc_water_percent, calc_bmr } from '../utils/bodyComposition.js';
import { reportCopy } from './guidedReport.js';
import { insightCopy, metricCopy, languageIndex } from './insightCopy.js';
import { numberParts, audioUnits, metricAudio } from './reportAudio.js';
import { reportInsights, reportRows, summaryAdvice } from '../utils/reportInsights.js';
import { getScanCount } from '../utils/reportSnapshot.js';

// Compose prerecorded words and numbers from actual readings. No runtime TTS,
// sample patient recordings or network is needed for a report overview.
export function bundledReportNarration(data, page, language='en') {
 const lang=['en','hi','bn'].includes(language)?language:'en';
 const w=reportCopy[lang],v=insightCopy[lang],i=languageIndex(lang);
 const all=reportInsights(data), fields=page===1?['height','weight','bmi']:page===2?['bodyFat','fatMass','fatFreeMass','bodyWater','restingEnergy']:page===3?['systolic','diastolic','bpm','oxygen','temperature']:['systolic','diastolic','bpm','oxygen'];
 // Use the same estimate formulas as the visible legacy report, not a second model.
 if(page===2) {
  const p=data.patient||{},vitals=data.vitals||{};
  const weight=Number(vitals.weight),height=Number(vitals.height),age=Number(p.age);
  const gender=String(p.gender||'').toLowerCase(),sex=gender==='male'?1:0;
  const valid=[weight,height,age].every(n=>Number.isFinite(n)&&n>0)&&['male','female'].includes(gender);
  const fat=valid?calc_fat_percent(weight,height,sex,age,Number(vitals.impedance)||0):null;
  const fatMass=valid?calc_fat_mass(weight,fat):null;
  const values={bodyFat:fat,fatMass,fatFreeMass:valid?weight-fatMass:null,bodyWater:valid?calc_water_percent(weight,height,sex,age,0):null,restingEnergy:valid?calc_bmr(weight,height,sex,age):null};
  for(const metric of all)if(Object.hasOwn(values,metric.key))metric.value=values[metric.key]===null?null:Math.round(values[metric.key]*10)/10;
 }
 const messages=[w.scan,...numberParts(getScanCount(data),lang)];
 if(page===5) messages.push(v[summaryAdvice(all)],v.next,v.shareText);
 else {
  messages.push(v.numbers,...all.filter(m=>fields.includes(m.key)).flatMap(m=>metricAudio(m,lang)));
  if(page===4) {
   const previous=reportRows(data).at(-2);
   if(previous){messages.push(w.previous,w.scan,...numberParts(previous.scan,lang));for(const key of fields){const n=Number(previous[key]);messages.push(metricCopy[key][0][i],...(n>0?numberParts(n,lang):[v.missing]),audioUnits[lang][metricCopy[key][2]]);}}
   messages.push(v.chart);
  }
 }
 return messages.filter(Boolean).map(text=>({text,langHint:lang}));
}
