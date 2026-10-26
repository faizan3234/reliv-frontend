import {useCallback,useEffect,useRef,useState} from 'react';
import {Meh,Smile,Laugh} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useHealth} from '../context/HealthContext';
import CommerceHeader,{commerceCopy} from '../components/CommerceHeader';
import UVCleansingAnimation from '../components/UVCleansingAnimation';
import {API_BASE} from '../config/api';
import {requestJSON} from '../utils/request';
import './KioskCommerce.css';
export default function MedicineFinish({language='en'}){
 const navigate=useNavigate(),{resetHealth}=useHealth();const c=commerceCopy[language]||commerceCopy.en;
 const [rating,setRating]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[done,setDone]=useState(false);
 const request=useRef(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 const home=useCallback(()=>{resetHealth();navigate('/',{replace:true});},[resetHealth,navigate]);
 const skip=()=>{request.current?.abort();setDone(true);};
 const send=async()=>{
  if(rating===null||request.current)return;
  const controller=new AbortController();request.current=controller;setBusy(true);setError(false);
  try{const result=await requestJSON(`${API_BASE}/api/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mood:[1,4,6][rating],role:'Medicine customer',submittedAt:new Date().toISOString()}),signal:controller.signal,timeoutMs:5000});if(!controller.signal.aborted){if(result?.ok===false)throw new Error('Feedback rejected');setDone(true);}}
  catch{if(!controller.signal.aborted)setError(true);}
  finally{if(request.current===controller)request.current=null;if(!controller.signal.aborted)setBusy(false);}
 };
 return <main className="commerce-screen"><CommerceHeader language={language} step={2}/>{done?<UVCleansingAnimation language={language} onComplete={home}/>:<section className="commerce-feedback"><h1>{c.feedback}</h1><p>{c.optional}</p><div className="commerce-moods">{c.moods.map((label,i)=><button key={label} disabled={busy} aria-pressed={rating===i} onClick={()=>setRating(i)}><span aria-hidden="true">{i===0?<Meh size={44}/>:i===1?<Smile size={44}/>:<Laugh size={44}/>}</span>{label}</button>)}</div>{error&&<p className="commerce-alert" role="alert">{c.error}</p>}<button className="commerce-primary" disabled={rating===null||busy} onClick={send}>{c.send}{busy?'…':' →'}</button><button className="commerce-quiet" onClick={skip}>{c.skip}</button></section>}</main>;
}
