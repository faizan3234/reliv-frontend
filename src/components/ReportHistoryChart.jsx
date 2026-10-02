import { metricCopy, insightCopy, languageIndex } from '../voice/insightCopy';
import { metricColours, reportRows } from '../utils/reportInsights';
import { reportCopy } from '../voice/guidedReport';
export default function ReportHistoryChart({data,field,language,bars}) {
 const rows=reportRows(data).slice(-12),i=languageIndex(language),w=reportCopy[language];
 const keys=field==='all'?['systolic','diastolic','oxygen','temperature','bpm','weight']: [field];
 return <figure className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <figcaption className="mb-4 text-lg font-semibold">{insightCopy[language].chart}</figcaption>
  <div className="space-y-3">{keys.map(key=>{
   const valid=rows.filter(r=>Number(r[key])>0),c=metricCopy[key],colour=metricColours[key]||'#0f766e';
   if(!valid.length)return <div key={key} className="rounded-xl bg-slate-50 p-4">{c[0][i]} · {w.missing}</div>;
   const min=bars?0:Math.min(...valid.map(r=>Number(r[key])))*.9,max=Math.max(...valid.map(r=>Number(r[key])))*1.1;
   const x=n=>80+n*680/Math.max(1,rows.length-1),y=v=>138-(v-min)/(max-min)*100;
   return <div key={key} className="rounded-2xl bg-slate-50 px-3 pt-3"><p className="flex justify-between font-bold" style={{color:colour}}><span>{c[0][i]}</span><span>{c[2]}</span></p>
    <svg viewBox="0 0 850 175" className="w-full" role="img" aria-label={`${c[0][i]}: ${valid.map(r=>`${w.scan} ${r.scan}: ${r[key]} ${c[2]}`).join(', ')}`}>
     {[0,.5,1].map(f=><g key={f}><path d={`M60 ${138-f*100}H790`} stroke="#cbd5e1"/><text x="50" y={143-f*100} textAnchor="end" fontSize="13">{Number((min+f*(max-min)).toFixed(1))}</text></g>)}
     {rows.map((r,n)=>Number(r[key])>0?<g key={r.scan}>{bars?<rect x={x(n)-18} y={y(r[key])} width="36" height={138-y(r[key])} rx="5" fill={colour}/>:<>{n>0&&Number(rows[n-1][key])>0&&<line x1={x(n-1)} y1={y(rows[n-1][key])} x2={x(n)} y2={y(r[key])} stroke={colour} strokeWidth="3"/>}<circle cx={x(n)} cy={y(r[key])} r="6" fill={colour}/></>}<text x={x(n)} y={y(r[key])-12} textAnchor="middle" fontSize="15" fill="#0f172a">{r[key]}</text><text x={x(n)} y="163" textAnchor="middle" fontSize="13">{w.scan} {r.scan}</text></g>:<text key={r.scan} x={x(n)} y="163" textAnchor="middle" fontSize="12">{r.scan}: —</text>)}
    </svg></div>;
  })}</div>
  <p className="mt-4 text-sm text-slate-600">{w.privacy}</p>
 </figure>;
}
