import { bodyEstimates } from './bodyEstimates.js';
import { metricCopy } from '../voice/insightCopy.js';
export const metricColours={systolic:'#dc2626',diastolic:'#f97316',oxygen:'#2563eb',temperature:'#15803d',bpm:'#9333ea',weight:'#0891b2',bmi:'#c026d3',bodyFat:'#d97706',bodyWater:'#0284c7',restingEnergy:'#7c3aed'};
const measured=new Set(['height','weight','systolic','diastolic','oxygen','bpm','temperature']);
// Screening cues, not diagnosis. Adult ranges must never be applied to children.
export function metricStatus(key,value,age,vitals={}) {
 if(value===null||!(Number(age)>=20)) return 'neutral';
 if(key==='systolic'||key==='diastolic') {
  const s=Number(vitals.systolic),d=Number(vitals.diastolic);
  if(!(s>0&&d>0))return 'neutral';
  if(s>180||d>120)return 'urgent';
  if(s>=140||d>=90)return 'review';
  if(s>=120||d>=80||s<90||d<60)return 'caution';
  return 'good';
 }
 if(key==='oxygen') return value<=92?'urgent':value<95?'caution':'good';
 if(key==='temperature') return value<95?'urgent':value>=100.4?'caution':'good';
 if(key==='bpm') return value<60||value>100?'caution':'good';
 if(key==='bmi')return value<18.5?'caution':value<25?'good':value<30?'caution':'review';
 return 'neutral';
}
export function reportInsights(data={}) {
 const v=data.vitals||{}, est=bodyEstimates(v,data.patient), values={...v,...est};
 return Object.entries(metricCopy).map(([key,c])=>{
  const raw=measured.has(key)?v[key]:est[key];
  const value=raw!==null&&raw!==''&&raw!==undefined&&Number.isFinite(Number(raw))&&Number(raw)>0?Number(raw):null;
  return {key,unit:c[2],value,kind:measured.has(key)?'measured':['bmi','bsa'].includes(key)?'calculated':'estimated',status:metricStatus(key,value,data.patient?.age,values)};
 });
}
export function summaryAdvice(metrics) {
 return metrics.some(m=>m.status==='urgent')?'urgentAdvice':metrics.some(m=>['review','caution'].includes(m.status))?'cautionAdvice':'goodAdvice';
}
export function reportRows(data) {
 const source=Array.isArray(data.history)&&data.history.length?data.history:[{...data.vitals,patient:data.patient}];
 const count=Number(data.scanCount)||1;
 return source.map((row,index)=>({...row,...bodyEstimates(row,row.patient||{}),scan:Math.max(1,count-source.length+1)+index}));
}
export function observationCount(data) {
 // Count actual retained observations, never multiply visit count by potential fields.
 return reportRows(data).reduce((sum,row)=>sum+reportInsights({vitals:row,patient:row.patient||{}}).filter(x=>x.value!==null).length,0);
}
