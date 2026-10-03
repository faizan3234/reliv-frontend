import { useMemo } from 'react';
import { reportRows } from '../utils/reportInsights';
import { metricCopy, languageIndex } from '../voice/insightCopy';
import { positiveReading } from '../utils/reportPresentation';

const words = {
 en:['What your saved scans show','Measurement','First','Latest','Lowest','Highest','Readings','These are your recorded values, not new tests or a diagnosis. A higher or lower number is not always better. Missing readings are left out.','Change from first'],
 hi:['आपके पुराने स्कैन क्या बताते हैं','माप','पहला','सबसे नया','सबसे कम','सबसे ज़्यादा','रीडिंग','ये आपके सेव किए हुए नंबर हैं, नई जाँच या बीमारी का पता नहीं। नंबर बढ़ना या घटना हमेशा अच्छा नहीं होता। जो रीडिंग नहीं आई, उसे नहीं गिना है।','पहले से बदलाव'],
 bn:['আগের স্ক্যানগুলো কী বলছে','মাপ','প্রথম','সবচেয়ে নতুন','সবচেয়ে কম','সবচেয়ে বেশি','রিডিং','এগুলো আপনার সেভ করা রিডিং, নতুন পরীক্ষা বা রোগের খবর নয়। নম্বর বাড়া বা কমা সব সময় ভালো নয়। না পাওয়া রিডিং গোনা হয়নি।','প্রথম থেকে বদল']
};
export default function VisitComparison({data,language='en'}) {
 const rows=useMemo(()=>reportRows(data),[data]);
 const w=words[language]||words.en;
 // Bounded seven measured fields; no invented estimates, unbounded DOM, or extra charts.
 const metrics=['weight','height','systolic','diastolic','bpm','oxygen','temperature'].map(key=>{
  const values=rows.map(row=>positiveReading(row[key])).filter(value=>value!==null);
  if(values.length<2)return null;
  return {key,first:values[0],latest:values.at(-1),min:Math.min(...values),max:Math.max(...values),n:values.length};
 }).filter(Boolean);
 if(!metrics.length)return null;
 const format=value=>Number(value.toFixed(1));
 return <details className="journey-details" open>
  <summary>{w[0]}</summary><p>{w[7]}</p>
  <div className="journey-table-wrap" tabIndex={0} role="region" aria-label={w[0]}>
   <table><thead><tr>{[w[1],w[2],w[3],w[8],w[4],w[5],w[6]].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead>
   <tbody>{metrics.map(m=><tr key={m.key}><th scope="row">{metricCopy[m.key][0][languageIndex(language)]} ({metricCopy[m.key][2]})</th><td>{format(m.first)}</td><td>{format(m.latest)}</td><td>{m.latest>m.first?'+':''}{format(m.latest-m.first)}</td><td>{format(m.min)}</td><td>{format(m.max)}</td><td>{m.n}</td></tr>)}</tbody></table>
  </div>
 </details>;
}
