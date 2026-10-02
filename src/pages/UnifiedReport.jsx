import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useHealth } from '../context/HealthContext';
import { useSpeech } from '../context/SpeechContext';
import { useVoicePage } from '../hooks/useVoicePage';
import SpokenGuide from '../components/SpokenGuide';
import ReportHistoryChart from '../components/ReportHistoryChart';
import Logo from '../components/Logo';
import { readBrowserStorage, writeBrowserStorage } from '../utils/browserStorage';
import { getScanCount } from '../utils/reportSnapshot';
import { reportCopy, reportStage } from '../voice/guidedReport';
import { insightCopy, metricCopy, languageIndex } from '../voice/insightCopy';
import { metricAudio, numberParts } from '../voice/reportAudio';
import { reportInsights, summaryAdvice, observationCount, reportRows, metricColours } from '../utils/reportInsights';

const tones={neutral:'border-slate-200 bg-slate-50 text-slate-700',good:'border-emerald-300 bg-emerald-50 text-emerald-900',caution:'border-amber-300 bg-amber-50 text-amber-900',review:'border-red-300 bg-red-50 text-red-900',urgent:'border-red-500 bg-red-100 text-red-950'};
function MetricCard({metric,language}) {
 const i=languageIndex(language),w=insightCopy[language],c=metricCopy[metric.key];
 return <div className={`rounded-2xl border-l-4 p-5 shadow-sm ${tones[metric.status]}`} data-metric={metric.key} data-status={metric.status}>
  <dt className="text-lg font-semibold">{c[0][i]}</dt><dd className="my-3 text-3xl font-bold">{metric.value===null?w.missing:metric.value} <span className="text-base font-normal">{metric.value===null?'':metric.unit}</span></dd>
  <p className="text-sm font-bold">{w[metric.kind]} · {w[metric.status]}</p><p className="mt-2 text-base leading-relaxed">{c[1][i]}</p>
 </div>;
}
export default function UnifiedReport() {
 const location=useLocation(),navigate=useNavigate(),{data,resetHealth,update}=useHealth(),{stop,speakChained}=useSpeech();
 const page=Math.min(5,Math.max(1,Number(location.pathname.match(/report-(\d)/)?.[1])||1));
 const [language,setLanguage]=useState(()=>{const candidate=data.reportSpeechLanguage||data.language||readBrowserStorage('reliv_report_speech_lang','sessionStorage');return ['en','hi','bn'].includes(candidate)?candidate:'en';});
 const [field,setField]=useState('all');
 const w=reportCopy[language],v=insightCopy[language],i=languageIndex(language),count=getScanCount(data);
 const metrics=reportInsights(data),stage=reportStage(data,language),rows=reportRows(data),advice=summaryAdvice(metrics);
 const visible=page===1?metrics.filter(m=>!['systolic','diastolic','oxygen','temperature','bpm'].includes(m.key)):page===2?metrics.filter(m=>m.kind==='measured'):metrics.filter(m=>m.status!=='neutral');
 const spokenMetrics=page===1||page===2?visible:page===5?visible.filter(m=>m.status!=='good'):metrics.filter(m=>field==='all'?['systolic','diastolic','oxygen','temperature','bpm','weight'].includes(m.key):m.key===field);
 const messages=[...(page===1?[stage,v.estimates,v.metabolic]:page===2?[stage,w.guides[1]]:page===5?[v[advice],v.next]:[stage,v.chart]),...spokenMetrics.flatMap(m=>metricAudio(m,language))];
 // Older values become audible as visits accumulate. Limit spoken history to
 // three visits; the chart/table retain the complete available window.
 if((page===3||page===4)&&rows.length>1) {
  for(const row of rows.slice(-3,-1)) {
   messages.push(w.previous,w.scan,...numberParts(row.scan,language));
   for(const metric of spokenMetrics) {
    const value=Number(row[metric.key]);
    messages.push(metricCopy[metric.key][0][i],...(value>0?numberParts(value,language):[v.missing]));
   }
  }
 }

 const narration=messages.join(' ');
 useVoicePage({onHelp:()=>speakChained(messages.map(text=>({text,langHint:language}))),idleEnabled:false});
 useEffect(()=>{window.scrollTo(0,0);},[page]);
 useEffect(()=>{const changed=e=>{if(['en','hi','bn'].includes(e.detail))setLanguage(e.detail);};window.addEventListener('reliv_report_language_change',changed);return()=>window.removeEventListener('reliv_report_language_change',changed);},[]);
 const next=number=>{stop();navigate(`/report-${number}`,{state:{sessionId:data.sessionId}});};
 const chooseLanguage=code=>{stop();setLanguage(code);update({reportSpeechLanguage:code});writeBrowserStorage('reliv_report_speech_lang',code,'sessionStorage');};
 const fat=metrics.find(m=>m.key==='bodyFat')?.value;
 return <main aria-label="Health screening report" className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-sky-50 px-6 py-6 pb-28 text-slate-900 touch-pan-y">
  <div className="mx-auto max-w-6xl space-y-6">
   <header className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-200 pb-4"><Logo size="text-3xl"/><div><p className="text-xl font-bold">{w.title} · {w.scan} {count}</p><p className="text-slate-600">{data.patient?.name} · {w.page} {page} / 5</p></div><div className="flex gap-2">{[['en','English'],['hi','हिंदी'],['bn','বাংলা']].map(([code,label])=><button type="button" key={code} onClick={()=>chooseLanguage(code)} aria-pressed={language===code} className={`min-h-12 rounded-xl px-4 font-semibold ${language===code?'bg-slate-900 text-white':'bg-white border border-slate-300'}`}>{label}</button>)}</div></header>
   <nav aria-label={w.page} className="grid grid-cols-5 gap-2">{w.titles.map((title,n)=><button type="button" key={title} onClick={()=>next(n+1)} aria-current={page===n+1?'step':undefined} className={`min-h-16 rounded-xl border px-2 py-3 font-semibold ${page===n+1?'border-orange-500 bg-orange-100 text-orange-950':'border-slate-200 bg-white'}`}>{n+1}. {title}</button>)}</nav>
   <section className="rounded-3xl bg-slate-900 p-7 text-white"><p className="text-orange-200">RELIV · {w.scan} {count}</p><h1 className="mt-2 text-3xl font-bold">{w.titles[page-1]}</h1><p className="mt-3 text-lg text-slate-200">{stage}</p><div className="mt-5 flex flex-wrap gap-6 text-sm"><span>{metrics.filter(m=>m.value!==null).length} {v.metrics}</span><span>{observationCount(data)} {v.observations} · {rows.length} {w.scan}</span></div></section>
   <SpokenGuide displayText={page===5?v[advice]:stage} text={narration} messages={messages} language={language} autoSpeak />
   {page===1&&<><section className="grid gap-5 md:grid-cols-2"><article className="rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-100 p-6"><h2 className="text-2xl font-bold">{v.composition}</h2>{fat!==null&&fat!==undefined&&<div className="mt-5 flex items-center gap-6"><div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full" style={{background:`conic-gradient(#f59e0b 0 ${fat}%,#6366f1 ${fat}% 100%)`}} role="img" aria-label={`${metricCopy.bodyFat[0][i]} ${fat}%, ${metricCopy.fatFreeMass[0][i]} ${(100-fat).toFixed(1)}%`}><div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-bold">{fat}%</div></div><div><p>● {metricCopy.bodyFat[0][i]}</p><p className="mt-2">● {metricCopy.fatFreeMass[0][i]}</p></div></div>}<p className="mt-4 leading-relaxed">{v.water}</p></article><article className="rounded-3xl border border-orange-200 bg-orange-50 p-6"><h2 className="text-2xl font-bold">{w.metabolic}</h2><p className="mt-4 text-lg leading-relaxed">{v.metabolic}</p><p className="mt-4 font-semibold">{w.age}: {data.patient?.age||'—'} {w.years}</p></article></section><p className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 leading-relaxed">{v.estimates}</p></>}
   {(page===1||page===2)&&<dl className="grid gap-4 md:grid-cols-3">{visible.map(metric=><MetricCard key={metric.key} metric={metric} language={language}/>)}</dl>}
   {page===2&&<p className="rounded-2xl bg-white p-5 text-sm">{v.reference}: BP 90–119 / 60–79 mmHg · SpO₂ 95–100% · Pulse 60–100 bpm · Temperature 95–100.3°F. {w.caution}</p>}
   {(page===3||page===4)&&<section><div className="mb-5 flex flex-wrap gap-2">{['all',...metrics.filter(m=>m.key!=='height').map(m=>m.key)].map(key=><button type="button" key={key} onClick={()=>{stop();setField(key);}} aria-pressed={field===key} className={`min-h-12 rounded-xl border-2 px-4 font-semibold ${field===key?'bg-slate-900 text-white':'bg-white text-slate-800'}`} style={{borderColor:metricColours[key]||'#64748b'}}>{key==='all'?v.all:metricCopy[key][0][i]}</button>)}</div><ReportHistoryChart data={data} field={field} language={language} bars={page===4}/>{page===4&&<div className="mt-5 overflow-x-auto rounded-2xl border bg-white p-4"><table className="w-full text-left"><caption className="mb-4 font-bold">{w.points} · {rows.length} {w.scan}</caption><thead><tr><th className="p-3">{w.scan}</th>{['systolic','diastolic','oxygen','temperature','weight'].map(key=><th className="p-3" key={key}>{metricCopy[key][0][i]} ({metricCopy[key][2]})</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.scan} className="border-t"><th className="p-3">{r.scan}<small className="block font-normal">{r.createdAt?String(r.createdAt).slice(0,10):''}</small></th>{['systolic','diastolic','oxygen','temperature','weight'].map(key=><td className="p-3" key={key}>{Number(r[key])>0?r[key]:'—'}</td>)}</tr>)}</tbody></table></div>}</section>}
   {page===5&&<><article className={`rounded-3xl border-l-4 p-7 ${advice==='urgentAdvice'?tones.urgent:advice==='cautionAdvice'?tones.caution:tones.good}`}><h2 className="text-2xl font-bold">{v.summary}</h2><p className="mt-4 text-xl leading-relaxed">{v[advice]}</p></article><dl className="grid gap-4 md:grid-cols-3">{visible.filter(m=>m.status!=='good').map(metric=><MetricCard key={metric.key} metric={metric} language={language}/>)}</dl><article className="rounded-3xl bg-indigo-50 p-7"><h2 className="text-2xl font-bold">{w.nextTitle}</h2><p className="mt-3 text-lg leading-relaxed">{v.next}</p></article><article className="flex flex-wrap items-center gap-8 rounded-3xl bg-gradient-to-r from-orange-100 to-pink-100 p-7"><div className="flex-1"><h2 className="text-2xl font-bold">{v.share}</h2><p className="mt-3 text-lg">{v.shareText}</p><p className="mt-3 text-sm">{v.noScore}</p>{data.reportPaymentUrl&&<p className="mt-3">{language==='hi'?'फोन के इंटरनेट से QR खोलें। रिपोर्ट ईमेल करें और शेयर कार्ड बनाएँ। वाई-फाई जोड़ने की जरूरत नहीं।':language==='bn'?'ফোনের ইন্টারনেটে QR খুলুন। রিপোর্ট ইমেল করুন আর শেয়ার কার্ড বানান। ওয়াই-ফাই লাগবে না।':'Scan with your phone’s internet to email your report and make a story card. No kiosk Wi-Fi needed.'}</p>}</div>{data.reportPaymentUrl&&<div className="rounded-2xl bg-white p-4"><QRCodeSVG value={data.reportPaymentUrl} size={180} level="L" marginSize={4}/></div>}</article></>}
   <p className="text-sm text-slate-600">{w.caution}</p>
  </div>
  <footer className="fixed inset-x-0 bottom-0 z-20 flex justify-between gap-4 border-t border-slate-200 bg-white p-4 px-8"><button type="button" disabled={page===1} onClick={()=>next(page-1)} className="min-h-14 rounded-xl border border-slate-300 px-8 text-xl font-bold disabled:opacity-30">{w.back}</button><span className="self-center font-semibold">{w.page} {page} / 5</span>{page<5?<button type="button" onClick={()=>next(page+1)} className="min-h-14 rounded-xl bg-orange-700 px-8 text-xl font-bold text-white">{w.next} →</button>:<button type="button" onClick={()=>{stop();resetHealth();navigate('/',{replace:true});}} className="min-h-14 rounded-xl bg-slate-900 px-8 text-xl font-bold text-white">{w.finish}</button>}</footer>
 </main>;
}
