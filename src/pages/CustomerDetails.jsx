import { createElement, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, History, Pill, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import SpokenGuide from '../components/SpokenGuide';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { useHealth } from '../context/HealthContext';
import { useSpeech } from '../context/SpeechContext';
import { useVoicePage } from '../hooks/useVoicePage';
import { API_BASE } from '../config/api';
import { saveKioskCustomer, saveKioskHealthProfile } from '../utils/kioskSession';
import { entryCopy } from '../voice/entryGuide';

export default function CustomerDetails(){
 const navigate=useNavigate(),{data,update}=useHealth(),{speakText,stop}=useSpeech();
 const language=['en','hi','bn'].includes(data.language)?data.language:'en',w=entryCopy[language];
 const [mode,setMode]=useState(null),[step,setStep]=useState(0),[keyboard,setKeyboard]=useState('');
 const [form,setForm]=useState({name:'',age:'',gender:''}),[pin,setPin]=useState(''),[showPin,setShowPin]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),mounted=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const isPin=mode==='returning'?step===1:step===2;
 const guide=busy?w.saving:error?error:!mode?w.choose:step===0?w.nameHelp:isPin?(mode==='returning'?w.returnHelp:w.pinHelp):w.detailsHelp;
 useVoicePage({idleEnabled:false,onHelp:()=>speakText(guide,{langHint:language})});
 const ready=step===0?form.name.trim().length>=2:isPin?pin.length===6:Number(form.age)>=1&&Number(form.age)<=120&&!!form.gender;
 const change=(key,value)=>setForm(prev=>({...prev,[key]:key==='age'?value.replace(/\D/g,'').slice(0,3):value.slice(0,80)}));
 const advance=async()=>{
  if(!ready||lock.current)return;
  setKeyboard('');setError('');stop();
  if(!isPin&&!(mode==='medicine'&&step===1)){setStep(step+1);return;}
  lock.current=true;setBusy(true);
  try{
   const patient={name:form.name.trim(),age:Number(form.age),gender:form.gender};
   const result=mode==='medicine'?await saveKioskCustomer(API_BASE,patient):await saveKioskHealthProfile(API_BASE,{...patient,mode,pin});
   if(!mounted.current)return;
   update({sessionId:result.sessionId,patient:result.customerData||patient});setPin('');
   navigate('/two-options',{state:{sessionId:result.sessionId}});
  }catch(e){if(mounted.current)setError([401,403].includes(e.status)?w.wrong:w.error);}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 };
 const choose=value=>{stop();setMode(value);setStep(0);setPin('');setShowPin(false);setError('');setKeyboard('');};
 return <main className={`min-h-screen bg-[#f3f7f8] p-6 text-slate-900 touch-pan-y ${keyboard?'pb-96':'pb-12'}`}>
  <header className="mx-auto mb-8 flex max-w-6xl items-center justify-between"><button type="button" disabled={busy} onClick={()=>{stop();if(step>0){setStep(step-1);setKeyboard('');setError('');}else if(mode)choose(null);else navigate('/');}} className="min-h-14 rounded-xl border border-slate-300 bg-white px-6 font-bold">← {w.back}</button><Logo size="text-4xl"/></header>
  <div className="mx-auto max-w-6xl"><h1 className="mb-6 text-4xl font-bold">{!mode?w.welcome:step===0?w.name:isPin?(mode==='returning'?w.returnPin:w.pin):w.details}</h1>
   {!mode?<div className="grid gap-5 md:grid-cols-3">{[[UserPlus,'new',w.new,w.newHint],[History,'returning',w.returning,w.returnHint],[Pill,'medicine',w.medicine,w.medicineHint]].map(([Icon,value,title,hint])=><button type="button" key={value} onClick={()=>choose(value)} className="min-h-64 rounded-3xl border-2 border-slate-200 bg-white p-8 text-left shadow-sm focus:border-teal-700">{createElement(Icon,{size:42,className:'mb-6 text-teal-700'})}<span className="block text-2xl font-bold">{title}</span><span className="mt-3 block text-lg text-slate-600">{hint}</span><ArrowRight className="mt-6 text-teal-700"/></button>)}</div>:<section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 lg:grid-cols-[1fr_1fr]">
    <div><p className="mb-5 text-lg font-semibold text-teal-800">{w.step} {step+1} / {mode==='new'?3:2}</p>
     {step===0&&<><label htmlFor="visitor-name" className="mb-3 block text-xl">{w.name}</label><input id="visitor-name" name="name" autoComplete="off" value={form.name} onFocus={()=>setKeyboard('name')} onClick={()=>setKeyboard('name')} onChange={e=>change('name',e.target.value)} maxLength={80} className="min-h-20 w-full rounded-2xl border-2 border-slate-300 p-5 text-3xl"/></>}
     {step===1&&mode!=='returning'&&<><label htmlFor="visitor-age" className="mb-3 block text-xl">{w.age}</label><input id="visitor-age" inputMode="numeric" value={form.age} onFocus={()=>setKeyboard('age')} onClick={()=>setKeyboard('age')} onChange={e=>change('age',e.target.value)} className="min-h-20 w-full rounded-2xl border-2 border-slate-300 p-5 text-3xl"/><fieldset className="mt-6"><legend className="mb-3 text-xl">{w.gender}</legend><div className="flex gap-3">{['male','female','other'].map(value=><button type="button" key={value} aria-pressed={form.gender===value} onClick={()=>{change('gender',value);setKeyboard('');}} className={`min-h-16 flex-1 rounded-xl border-2 px-3 text-xl font-bold ${form.gender===value?'border-teal-700 bg-teal-50':'border-slate-200'}`}>{w[value]}</button>)}</div></fieldset></>}
     {isPin&&<><div aria-label={mode==='returning'?w.returnPin:w.pin} className="mb-4 flex gap-3">{Array.from({length:6},(_,i)=><span key={i} className="flex h-16 flex-1 items-center justify-center rounded-xl bg-slate-100 text-3xl font-bold">{pin[i]?(showPin?pin[i]:'●'):'—'}</span>)}</div><button type="button" onClick={()=>setShowPin(!showPin)} className="mb-4 min-h-12 rounded-xl border px-4 font-bold">{showPin?w.hide:w.show}</button><div aria-label="PIN keypad" className="grid grid-cols-3 gap-3">{[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((digit,i)=>digit===''?<span key={i}/>:<button type="button" key={i} aria-label={digit==='⌫'?w.delete:`Digit ${digit}`} onClick={()=>setPin(prev=>digit==='⌫'?prev.slice(0,-1):(prev+digit).slice(0,6))} className="min-h-16 rounded-xl bg-slate-100 text-3xl font-bold">{digit}</button>)}</div></>}
     <button type="button" disabled={!ready||busy} onClick={advance} className="mt-6 min-h-16 w-full rounded-xl bg-teal-800 px-6 text-2xl font-bold text-white disabled:opacity-40">{busy?w.saving:isPin?w.start:w.continue} →</button>
    </div><div><SpokenGuide text={guide} language={language} autoSpeak/>{error&&<p role="alert" className="mt-4 text-xl text-red-700">{error}</p>}</div>
   </section>}
   {!mode&&<SpokenGuide text={guide} language={language} autoSpeak/>}
  </div>{keyboard&&<VirtualKeyboard inputName={keyboard} inputs={form} onChange={change} onClose={()=>setKeyboard('')} compact language={language}/>}
 </main>;
}
