import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHealth } from '../context/HealthContext';
import { useSpeech } from '../context/SpeechContext';
import { useVoicePage } from '../hooks/useVoicePage';
import SpokenGuide from '../components/SpokenGuide';
import Logo from '../components/Logo';
import { readBrowserStorage, writeBrowserStorage } from '../utils/browserStorage';
import { getScanCount, reportMeasurements } from '../utils/reportSnapshot';
import { measurementNames } from '../voice/reportQuestions';
import { reportCopy, reportStage, chartScans, reportDetail } from '../voice/guidedReport';

function HistoryChart({ data, field, language, bars }) {
 const w=reportCopy[language], rows=chartScans(data), label=measurementNames[language][field];
 const unit=reportMeasurements().find(x=>x.key===field)?.unit;
 const valid=rows.filter(r=>Number.isFinite(Number(r[field]))&&Number(r[field])>0);
 if(!valid.length) return <p className="p-12 text-xl">{w.missing}</p>;
 const max=Math.max(...valid.map(r=>Number(r[field])))*1.15;
 const x=i=>70+i*660/Math.max(1,rows.length-1),y=v=>230-Number(v)/max*185;
 return <figure className="rounded-2xl border border-slate-200 bg-white p-6">
   <figcaption className="flex justify-between text-xl font-bold"><span>{label}</span><span>{unit}</span></figcaption>
   <svg viewBox="0 0 820 290" role="img" aria-label={`${label}: ${valid.map(r=>`${w.scan} ${r.scan}: ${r[field]} ${unit}`).join(', ')}`} className="w-full max-h-80">
    {[0,.5,1].map(f=><g key={f}><path d={`M50 ${230-f*185}H780`} stroke="#e2e8f0"/><text x="42" y={235-f*185} textAnchor="end" fontSize="14">{Math.round(max*f)}</text></g>)}
    {rows.map((r,i)=>Number(r[field])>0 ? <g key={r.scan}>
     {bars?<rect x={x(i)-23} y={y(r[field])} width="46" height={230-y(r[field])} rx="6" fill="#0f766e"/>:<><circle cx={x(i)} cy={y(r[field])} r="7" fill="#0f766e"/>{i>0&&Number(rows[i-1][field])>0&&<line x1={x(i-1)} y1={y(rows[i-1][field])} x2={x(i)} y2={y(r[field])} stroke="#0f766e" strokeWidth="3"/>}</>}
     <text x={x(i)} y={y(r[field])-13} textAnchor="middle" fontSize="17" fill="#0f172a">{r[field]}</text><text x={x(i)} y="258" textAnchor="middle" fontSize="15">{w.scan} {r.scan}</text>
    </g>:<text key={r.scan} x={x(i)} y="258" textAnchor="middle" fontSize="12">{r.scan}: —</text>)}
   </svg>
   <p className="text-slate-600">{w.chart} · {w.privacy}</p>
   <div className="mt-3 flex flex-wrap gap-3 text-sm">{rows.map(r=><span key={r.scan}>{w.scan} {r.scan}: {Number(r[field])>0?`${r[field]} ${unit}`:w.missing}{r.createdAt ? ` · ${String(r.createdAt).slice(0,10)}`:''}</span>)}</div>
 </figure>;
}
export default function UnifiedReport() {
 const location=useLocation(),navigate=useNavigate();
 const {data,resetHealth,update}=useHealth(); const {stop,speakChained}=useSpeech();
 const page=Math.min(5,Math.max(1,Number(location.pathname.match(/report-(\d)/)?.[1])||1));
 const [language,setLanguage]=useState(()=>{const candidate=data.reportSpeechLanguage||data.language||readBrowserStorage('reliv_report_speech_lang','sessionStorage');return ['en','hi','bn'].includes(candidate)?candidate:'en';});
 const [field,setField]=useState('systolic');
 const w=reportCopy[language],labels=measurementNames[language],count=getScanCount(data);
 const stage=reportStage(data,language),detail=reportDetail(data,language,page,field);
 const messages=[w.guides[page-1],stage,detail];
 const narration=messages.join(' ');
 useVoicePage({onHelp:()=>speakChained(messages.map(text=>({text,langHint:language}))),idleEnabled:false});
 useEffect(()=>{window.scrollTo(0,0);},[page]);
 useEffect(()=>{const changed=e=>{if(['en','hi','bn'].includes(e.detail))setLanguage(e.detail);};window.addEventListener('reliv_report_language_change',changed);return()=>window.removeEventListener('reliv_report_language_change',changed);},[]);
 const next=number=>{stop();navigate(`/report-${number}`,{state:{sessionId:data.sessionId}});};
 const selectLanguage=code=>{stop();setLanguage(code);update({reportSpeechLanguage:code});writeBrowserStorage('reliv_report_speech_lang',code,'sessionStorage');};
 const readings=reportMeasurements(data.vitals), metabolic=Number(data.vitals?.metabolicAge);
 const comparable=chartScans(data).filter(row=>Number(row[field])>0);
 const current=comparable.at(-1)?.[field], previous=comparable.at(-2)?.[field];
 const delta=previous===undefined?null:Number((Number(current)-Number(previous)).toFixed(2));
 return <main aria-label="Health screening report" className="min-h-screen bg-[#f3f7f8] px-6 py-6 pb-28 text-slate-900 touch-pan-y">
  <div className="mx-auto max-w-6xl space-y-5">
   <header className="flex flex-wrap justify-between gap-4 border-b border-slate-200 pb-4"><Logo size="text-3xl"/><div><p className="text-xl font-bold">{w.title} · {w.scan} {count}</p><p className="text-slate-600">{data.patient?.name} · {w.page} {page} / 5</p></div><div className="flex items-center gap-2">{[['en','English'],['hi','हिंदी'],['bn','বাংলা']].map(([code,label])=><button type="button" key={code} onClick={()=>selectLanguage(code)} aria-pressed={language===code} className={`min-h-12 rounded-xl px-4 font-semibold ${language===code?'bg-teal-800 text-white':'bg-white border border-slate-300'}`}>{label}</button>)}</div></header>
   <nav aria-label={w.page} className="grid grid-cols-5 gap-2">{w.titles.map((title,i)=><button type="button" key={title} onClick={()=>next(i+1)} aria-current={page===i+1?'step':undefined} className={`min-h-16 rounded-xl border px-2 py-3 text-sm font-semibold ${page===i+1?'border-teal-700 bg-teal-50 text-teal-900':'border-slate-200 bg-white'}`}>{i+1}. {title}</button>)}</nav>
   <div><h1 className="text-3xl font-bold">{w.titles[page-1]}</h1><p className="mt-2 text-lg text-slate-600">{stage}</p></div>
   {page===1&&<section className="grid gap-5 md:grid-cols-2"><div className="rounded-3xl bg-teal-900 p-8 text-white"><h2 className="text-2xl">{w.metabolic}</h2><p className="my-5 text-6xl font-bold">{metabolic>0?metabolic:'—'}</p><p className="text-lg leading-relaxed">{metabolic>0?w.estimated:w.unavailable}</p></div><div className="rounded-3xl border border-slate-200 bg-white p-8"><h2 className="text-xl">{w.age}</h2><p className="my-4 text-4xl font-bold">{data.patient?.age||'—'} {w.years}</p>{readings.slice(0,2).map(r=><p key={r.key} className="mt-4 text-xl">{labels[r.key]}: <strong>{r.value===null?w.missing:`${r.value} ${r.unit}`}</strong></p>)}</div></section>}
   {(page===2||page===5)&&<dl className="grid grid-cols-2 gap-4 md:grid-cols-4">{readings.map(r=><div key={r.key} className="rounded-2xl border border-slate-200 bg-white p-5"><dt className="text-lg text-slate-600">{labels[r.key]}</dt><dd className="mt-3 text-2xl font-bold">{r.value===null?w.missing:`${r.value} ${r.unit}`}</dd></div>)}</dl>}
   {(page===3||page===4)&&<section><p className="mb-3 font-semibold">{w.choose}</p><div className="mb-4 flex flex-wrap gap-2">{readings.filter(r=>r.key!=='height').map(r=><button type="button" key={r.key} onClick={()=>{stop();setField(r.key);}} aria-pressed={field===r.key} className={`min-h-12 rounded-xl px-4 font-semibold ${field===r.key?'bg-teal-800 text-white':'bg-white border border-slate-300'}`}>{labels[r.key]}</button>)}</div><HistoryChart data={data} field={field} language={language} bars={page===4}/>{page===4&&<div className="mt-4 grid grid-cols-3 gap-3">{[[w.previous,previous],[w.current,current],[w.difference,delta===null?null:`${delta>0?'+':''}${delta}`]].map(([label,value])=><div key={label} className="rounded-xl bg-white p-5"><p className="text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold">{value??w.none}</p></div>)}</div>}</section>}
   {page===5&&<section className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">{w.improveTitle}</h2><p className="mt-3 text-lg leading-relaxed">{w.improveText}</p></article><article className="rounded-2xl bg-teal-50 p-6"><h2 className="text-xl font-bold">{w.nextTitle}</h2><p className="mt-3 text-lg leading-relaxed">{w.nextText}</p></article></section>}
   <SpokenGuide text={narration} messages={messages} language={language} autoSpeak/>
   <p className="text-sm text-slate-600">{w.caution}</p>
  </div>
  <footer className="fixed inset-x-0 bottom-0 z-20 flex justify-between gap-4 border-t border-slate-200 bg-white p-4 px-8"><button type="button" disabled={page===1} onClick={()=>next(page-1)} className="min-h-14 rounded-xl border border-slate-300 px-8 text-xl font-bold disabled:opacity-30">{w.back}</button><span className="self-center font-semibold">{w.page} {page} / 5</span>{page<5?<button type="button" onClick={()=>next(page+1)} className="min-h-14 rounded-xl bg-teal-800 px-8 text-xl font-bold text-white">{w.next} →</button>:<button type="button" onClick={()=>{stop();resetHealth();navigate('/',{replace:true});}} className="min-h-14 rounded-xl bg-teal-800 px-8 text-xl font-bold text-white">{w.finish}</button>}</footer>
 </main>;
}
