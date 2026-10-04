import { calc_fat_percent, calc_fat_mass, calc_water_percent, calc_bmr } from '../utils/bodyComposition.js';
import { insightCopy } from './insightCopy.js';
import { metricAudio, numberParts } from './reportAudio.js';
import { buildPersonalizedReport, displayedReportScore, personalizedActions } from './personalizedReport.js';
import { personalizedReportCopy } from './personalizedReportCopy.js';
import { reportInsights } from '../utils/reportInsights.js';

// Compose prerecorded words and numbers from actual readings. No runtime TTS,
// sample patient recordings or network is needed for a report overview.
function referenceMetrics(data, page) {
 const all=reportInsights(data);
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
 return all;
}
export function bundledReportNarration(data, page, language='en') {
 const lang=['en','hi','bn'].includes(language)?language:'en';
 const all=referenceMetrics(data,page);
 const fields=['bodyFat','fatMass','fatFreeMass','bodyWater','restingEnergy'];
 const c=personalizedReportCopy[lang];
 const semanticPage=page===2?1:page===3?2:page;
 const intro=[c.pages[0],c.estimates,c.pages[1],c.pages[3],c.pages[4]][page-1];
 return buildPersonalizedReport({data,page:semanticPage,language:lang,score:data.bodyScore,
  metricsOverride:all,intro,omitScore:page===2,
  overviewFields:page===1?['height','weight','bmi']:page===2?fields:undefined
 }).map(text=>({text,langHint:lang}));
}

// Tapping a card uses the same data and offline recordings as the overview.
export function bundledMetricNarration(data, key, language='en') {
 const lang=['en','hi','bn'].includes(language)?language:'en';
 const c=personalizedReportCopy[lang], v=insightCopy[lang];
 let parts;
 if (key==='bodyScore') {
  const score=displayedReportScore(data,data.bodyScore);
  parts=[c.score,...(score===null?[v.missing]:[...numberParts(score,lang),c.scoreEnd])];
 } else {
  const aliases={pulse:'bpm',bodyFatPercent:'bodyFat',fatPercent:'bodyFat',bodyWaterPercent:'bodyWater',waterPercent:'bodyWater',bmr:'restingEnergy'};
  const actual=aliases[key]||key;
  const selected=referenceMetrics(data,2).filter(m=>key==='bloodPressure'?['systolic','diastolic'].includes(m.key):m.key===actual);
  parts=selected.length?[...selected.flatMap(m=>metricAudio(m,lang)),...personalizedActions(selected,lang)]
   :['metabolicAge','visceralFat'].includes(key)?[v.metabolic]:[v.missing,c.estimates];
 }
 return parts.filter(Boolean).map(text=>({text,langHint:lang}));
}
