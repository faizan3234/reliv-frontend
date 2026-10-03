import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHealth } from '../context/HealthContext';
import { useSpeech } from '../context/SpeechContext';
import { usesNativeScrolling } from '../utils/phoneExperience';
import SpokenGuide from './SpokenGuide';
import { API_BASE } from '../config/api';
import { readKioskSession } from '../utils/kioskSession';

const copy={en:{prompt:'Are you still here? Tap Continue to keep using the kiosk. Otherwise your information will be cleared from this screen.',stay:'Continue my visit',end:'Finish now'},hi:{prompt:'क्या आप अभी यहाँ हैं? जाँच जारी रखने के लिए आगे बढ़ें दबाएँ। नहीं तो स्क्रीन से आपकी जानकारी हटा दी जाएगी।',stay:'मेरी जाँच जारी रखें',end:'अभी समाप्त करें'},bn:{prompt:'আপনি কি এখনও এখানে আছেন? পরীক্ষা চালিয়ে যেতে এগিয়ে যান চাপুন। না হলে স্ক্রিন থেকে আপনার তথ্য মুছে যাবে।',stay:'আমার পরীক্ষা চালিয়ে যান',end:'এখন শেষ করুন'}};
export default function IdleReturn(){
 const {pathname}=useLocation(),navigate=useNavigate(),{data,resetHealth}=useHealth(),{stop}=useSpeech();
 const [remaining,setRemaining]=useState(null),last=useRef(Date.now());
 const language=['en','hi','bn'].includes(data.language)?data.language:'en',w=copy[language];
 const finish=useCallback(()=>{
  // Cancel only unpaid requests server-side; paid/uncertain fulfillment remains in SQLite.
  try{const session=readKioskSession();if(session&&!data.paymentVerified)void fetch(`${API_BASE}/api/sessions/${encodeURIComponent(session.sessionId)}/payment-v2/cancel`,{method:'POST',headers:{'Content-Type':'application/json'}}).catch(()=>{});}catch{/* Storage may be disabled. */}
  stop();resetHealth();setRemaining(null);navigate('/',{replace:true});
 },[data.paymentVerified,navigate,resetHealth,stop]);
 useEffect(()=>{
  last.current=Date.now();setRemaining(null);
  // A pending physical delivery must remain visible for staff/customer review.
  if(pathname==='/'||pathname==='/order-success'||pathname==='/wifi'||pathname.startsWith('/admin')||usesNativeScrolling(pathname))return undefined;
  const limit=pathname==='/payment'?600000:pathname.startsWith('/report-')?240000:120000;
  const activity=()=>{if(Date.now()-last.current>=limit)return;last.current=Date.now();setRemaining(null);};
  const narration=e=>{if(pathname.startsWith('/report-')&&e.detail===true)activity();};
  window.addEventListener('reliv_speaking',narration);
  const events=['pointerdown','keydown','touchstart','scroll'];
  events.forEach(e=>window.addEventListener(e,activity,{passive:true,capture:true}));
  const interval=setInterval(()=>{const elapsed=Date.now()-last.current;if(elapsed>=limit+30000)finish();else setRemaining(elapsed>=limit?Math.ceil((limit+30000-elapsed)/1000):null);},1000);
  return()=>{window.removeEventListener('reliv_speaking',narration);clearInterval(interval);events.forEach(e=>window.removeEventListener(e,activity,true));};
 },[pathname,finish]);
 if(remaining===null)return null;
 return <div role="dialog" aria-modal="true" aria-label={w.stay} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 p-8"><div className="max-w-2xl rounded-3xl bg-white p-8"><p className="text-center text-5xl font-bold">{remaining}</p><SpokenGuide text={w.prompt} language={language} autoSpeak/><div className="flex gap-4"><button type="button" onClick={()=>{stop();last.current=Date.now();setRemaining(null);}} className="min-h-16 flex-1 rounded-xl bg-teal-800 px-5 text-xl font-bold text-white">{w.stay}</button><button type="button" onClick={finish} className="min-h-16 rounded-xl border px-5 font-bold">{w.end}</button></div></div></div>;
}
