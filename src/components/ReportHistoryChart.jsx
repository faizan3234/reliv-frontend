import { useMemo, useState } from 'react';
import { metricCopy, languageIndex, insightCopy } from '../voice/insightCopy';
import { metricStatus, reportRows } from '../utils/reportInsights';
import { reportCopy } from '../voice/guidedReport';
import { getScanCount } from '../utils/reportSnapshot';
import { positiveReading } from '../utils/reportPresentation';

const colours = { systolic:'#ef4444', diastolic:'#3b82f6', bpm:'#10b981', oxygen:'#a855f7', temperature:'#b45309', weight:'#0891b2' };
const copy = {
 en: {locked:'Trends appear after your next scan', why:'One scan shows a value, not a change. Complete another scan to compare your readings.', pick:'Tap a scan to keep its readings open.', older:'Earlier scans', newer:'Later scans', bp:'Blood pressure · mmHg', other:'Pulse · bpm / Oxygen · %', line:'Line chart', bar:'Bar chart', coverage:'Recorded readings', coverageNote:'Data completeness, not medical confidence.', summary:'Your journey', change:'Change is not automatically improvement. Compare the same measurement and unit.', stable:'Similar readings', varied:'Readings vary', repeat:'Repeat measurements under similar conditions.', retained:'Showing up to seven scans at a time. Earlier saved scans remain available.'},
 hi: {locked:'अगले स्कैन के बाद रुझान दिखेंगे', why:'एक स्कैन माप बताता है, बदलाव नहीं। तुलना के लिए अगला स्कैन पूरा करें।',pick:'किसी स्कैन को छूकर उसके माप देखें।',older:'पुराने स्कैन',newer:'अगले स्कैन',bp:'रक्तचाप · mmHg',other:'नाड़ी · bpm / ऑक्सीजन · %',line:'रेखा चार्ट',bar:'बार चार्ट',coverage:'दर्ज माप',coverageNote:'यह डेटा की पूर्णता है, मेडिकल विश्वास नहीं।',summary:'आपकी यात्रा',change:'बदलाव हमेशा सुधार नहीं होता। समान माप और इकाई की तुलना करें।',stable:'लगभग समान माप',varied:'माप बदल रहे हैं',repeat:'अगली बार समान परिस्थितियों में माप लें।',retained:'एक बार में सात स्कैन। पुराने सहेजे स्कैन भी देख सकते हैं।'},
 bn: {locked:'পরের স্ক্যানের পরে প্রবণতা দেখা যাবে',why:'একটি স্ক্যান মাপ দেখায়, পরিবর্তন নয়। তুলনার জন্য আরেকটি স্ক্যান করুন।',pick:'একটি স্ক্যান ছুঁয়ে তার মাপ দেখুন।',older:'আগের স্ক্যান',newer:'পরের স্ক্যান',bp:'রক্তচাপ · mmHg',other:'নাড়ি · bpm / অক্সিজেন · %',line:'রেখা চার্ট',bar:'বার চার্ট',coverage:'নথিভুক্ত মাপ',coverageNote:'এটি তথ্যের পূর্ণতা, চিকিৎসাগত নিশ্চয়তা নয়।',summary:'আপনার যাত্রা',change:'পরিবর্তন সব সময় উন্নতি নয়। একই মাপ ও এককের তুলনা করুন।',stable:'প্রায় একই মাপ',varied:'মাপ পরিবর্তিত হচ্ছে',repeat:'পরের বার একই পরিস্থিতিতে মাপ নিন।',retained:'একবারে সাতটি স্ক্যান। আগের সংরক্ষিত স্ক্যানও দেখতে পারেন।'},
};

export default function ReportHistoryChart({ data, field = 'all', language = 'en', bars = false }) {
 const allRows = useMemo(() => reportRows(data), [data]);
 const [endOffset, setEndOffset] = useState(0);
 const [selectedScan, setSelectedScan] = useState(null);
 const [mode, setMode] = useState(bars ? 'bar' : 'line');
 const c=copy[language]||copy.en, w=reportCopy[language]||reportCopy.en, statusCopy=insightCopy[language]||insightCopy.en;
 const count=getScanCount(data), keys=field==='all'?['systolic','diastolic','bpm','oxygen']:[field];
 const end=Math.max(1,allRows.length-Math.min(endOffset,Math.max(0,allRows.length-1)));
 const rows=allRows.slice(Math.max(0,end-7),end);
 const selected=rows.find(row=>row.scan===selectedScan)||rows.at(-1);
 const previous=allRows[allRows.findIndex(row=>row.scan===selected?.scan)-1];
 const left=64,right=676,top=44,bottom=278;
 const values=keys.flatMap(key=>rows.map(row=>positiveReading(row[key])).filter(v=>v!==null));
 const leftValues=(field==='all'?['systolic','diastolic']:keys).flatMap(key=>rows.map(row=>positiveReading(row[key])).filter(v=>v!==null));
 const rightValues=rows.flatMap(row=>['bpm','oxygen'].map(key=>positiveReading(row[key])).filter(v=>v!==null));
 const maxLeft=Math.max(1,Math.ceil(Math.max(...leftValues, field==='all'?160:1)*1.1/10)*10);
 const maxRight=Math.max(160,Math.ceil(Math.max(...rightValues,0)*1.1/10)*10);
 const x=n=>left+(n+.5)*(right-left)/Math.max(1,rows.length);
 const y=(value,key)=>bottom-value/(field==='all'&&['bpm','oxygen'].includes(key)?maxRight:maxLeft)*(bottom-top);
 const total=allRows.length*keys.length, recorded=allRows.reduce((sum,row)=>sum+keys.filter(key=>positiveReading(row[key])!==null).length,0);
 const select=scan=>setSelectedScan(scan);
 const page=direction=>{setEndOffset(offset=>Math.max(0,Math.min(allRows.length-1,offset+direction*7)));setSelectedScan(null);};
 if(count<2) return <section className="report-card report-trend-lock" aria-label={c.locked}><span aria-hidden="true">🔒</span><h3>{c.locked}</h3><p>{c.why}</p><p>{w.scan} {count} · {w.baseline}</p></section>;
 return <figure className="report-card report-chart report-combined-chart" data-chart-field={field}>
  <div className="report-chart-head"><div><figcaption>{c.summary} · {w.scan} {rows[0]?.scan}–{rows.at(-1)?.scan}</figcaption><p className="report-muted">{c.pick}</p></div><div className="report-chart-modes">{['line','bar'].map(type=><button key={type} type="button" aria-pressed={mode===type} onClick={()=>setMode(type)}>{c[type]}</button>)}</div></div>
  <div className="report-chart-legend">{keys.map(key=><span key={key}><i style={{background:colours[key]}}/>{metricCopy[key][0][languageIndex(language)]} ({metricCopy[key][2]})</span>)}</div>
  {values.length ? <svg viewBox="0 0 740 325" role="group" aria-label={`${c[mode]} · ${w.scan}`}>
   <text x={left} y="20" fontSize="13" fill="#555">{field==='all'?c.bp:metricCopy[field][2]}</text>
   {field==='all'&&<text x={right} y="20" textAnchor="end" fontSize="13" fill="#555">{c.other}</text>}
   {[0,.25,.5,.75,1].map(f=><g key={f} aria-hidden="true"><line x1={left} x2={right} y1={bottom-f*(bottom-top)} y2={bottom-f*(bottom-top)} stroke="#e5e7eb"/><text x={left-12} y={bottom-f*(bottom-top)+5} textAnchor="end" fontSize="13" fill="#666">{+(maxLeft*f).toFixed(1)}</text>{field==='all'&&<text x={right+12} y={bottom-f*(bottom-top)+5} fontSize="13" fill="#666">{+(maxRight*f).toFixed(1)}</text>}</g>)}
   {keys.map((key,k)=><g key={key}>{rows.map((row,n)=>{
    const value=positiveReading(row[key]),prev=n?positiveReading(rows[n-1][key]):null;
    if(value===null)return null;
    const width=Math.min(18,(right-left)/rows.length/(keys.length+2));
    return <g key={row.scan}>{mode==='line'&&prev!==null&&<path d={count>=4?`M ${x(n-1)} ${y(prev,key)} C ${(x(n-1)+x(n))/2} ${y(prev,key)}, ${(x(n-1)+x(n))/2} ${y(value,key)}, ${x(n)} ${y(value,key)}`:`M ${x(n-1)} ${y(prev,key)} L ${x(n)} ${y(value,key)}`} stroke={colours[key]} fill="none" strokeWidth="2.5"/>}{mode==='bar'?<rect data-reading="bar" x={x(n)+(k-keys.length/2)*width} y={y(value,key)} width={width-2} height={bottom-y(value,key)} rx="3" fill={colours[key]}/>:<circle data-reading="point" cx={x(n)} cy={y(value,key)} r="5" fill={colours[key]} stroke="white" strokeWidth="1.5"/>}</g>;
   })}</g>)}
   {rows.map((row,n)=><g key={row.scan} role="button" tabIndex={0} aria-label={`${w.scan} ${row.scan}`} aria-pressed={selected?.scan===row.scan} onClick={()=>select(row.scan)} onKeyDown={event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();select(row.scan);}}}>
    {selected?.scan===row.scan&&<line x1={x(n)} x2={x(n)} y1={top} y2={bottom} stroke="#64748b" strokeDasharray="4 4"/>}<rect x={x(n)-(right-left)/rows.length/2} y={top} width={(right-left)/rows.length} height={bottom-top+35} fill="transparent" style={{cursor:'pointer'}}/><text x={x(n)} y="307" textAnchor="middle" fill="#444" fontSize="14">{row.scan}</text>
   </g>)}
  </svg>:<p>{w.missing}</p>}
  <div className="report-selected-scan" aria-live="polite"><h3>{w.scan} {selected?.scan} <small>{selected?.createdAt?String(selected.createdAt).slice(0,10):''}</small></h3><div className="report-selected-grid">{keys.map(key=>{
   const value=positiveReading(selected?.[key]),before=positiveReading(previous?.[key]);
   const delta=value!==null&&before!==null?+(value-before).toFixed(1):null;
   const status=metricStatus(key,value,selected?.patient?.age??data.patient?.age,selected);
   return <div key={key} data-status={status}><strong>{metricCopy[key][0][languageIndex(language)]}</strong><p>{value??'—'} <small>{metricCopy[key][2]}</small></p><span>{value===null?w.missing:statusCopy[status]}</span>{count>=3&&<small className="report-delta">{delta===null?w.none:`${delta>0?'↑':delta<0?'↓':'—'} ${Math.abs(delta)} ${metricCopy[key][2]} · ${w.previous}`}</small>}{count>=4&&delta!==null&&<small>{delta===0?c.stable:c.varied}</small>}</div>;
  })}</div></div>
  {allRows.length>7&&<div className="report-chart-pager"><button type="button" disabled={end<=7} onClick={()=>page(1)}>← {c.older}</button><span>{rows[0]?.scan}–{rows.at(-1)?.scan} / {count}</span><button type="button" disabled={endOffset===0} onClick={()=>page(-1)}>{c.newer} →</button></div>}
  {count>=5&&<p className="report-note">{c.coverage}: {recorded}/{total} ({total?Math.round(recorded/total*100):0}%). {c.coverageNote}</p>}
  <p className="report-muted">{c.change} {count>=6?c.repeat:''}</p>
  {count>=7&&<p className="report-muted">{c.retained}</p>}
 </figure>;
}
