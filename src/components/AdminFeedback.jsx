import {useEffect,useRef,useState} from 'react';
import {adminFetch} from '../utils/adminSession';
import {API_BASE} from '../config/api';
export default function AdminFeedback(){
 const [open,setOpen]=useState(false),[items,setItems]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[more,setMore]=useState(false);
 const request=useRef(null);useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
 async function load(before){
  if(request.current)return;const c=new AbortController();request.current=c;setBusy(true);setError('');
  const timeout=setTimeout(()=>c.abort(),10000);
  try{const r=await adminFetch(`${API_BASE}/api/admin/feedback${before?'?before='+before:''}`,{signal:c.signal,cache:'no-store'});const data=await r.json();if(!r.ok||!Array.isArray(data.items))throw Error(data.message||'Cannot load feedback.');if(request.current!==c)return;setItems(prev=>before?[...prev,...data.items]:data.items);setMore(data.items.length===50);}
  catch(e){if(request.current===c)setError(c.signal.aborted?'Request stopped. Please retry.':e.message);}
  finally{clearTimeout(timeout);if(request.current===c){request.current=null;setBusy(false);}}
 }
 return <section className="rounded-2xl border bg-white p-4 space-y-3"><button className="min-h-12 text-lg font-bold" aria-expanded={open} onClick={()=>{setOpen(!open);if(!open)void load();}}>Feedback saved on this kiosk</button>{open&&<><p>No Internet is needed. These are customer comments, not proof of delivery.</p><button disabled={busy} className="min-h-12 underline" onClick={()=>load()}>Refresh feedback</button>{busy&&<p role="status">Loading…</p>}{error&&<p role="alert">{error}</p>}{!busy&&!error&&!items.length&&<p>No feedback yet.</p>}{items.map(row=><article key={row.id} className="rounded-xl border p-4 break-words"><strong>{row.payload.name||'Anonymous'} · Rating {row.payload.mood}/6</strong><p>{row.created_at} UTC · {row.payload.role}</p><p>{row.payload.positives.join(' · ')}</p><p>{row.payload.comment}</p>{row.payload.collaboration&&<p>Contact requested: {row.payload.collaboration.email} · {row.payload.collaboration.phone}</p>}</article>)}{more&&<button disabled={busy} onClick={()=>load(items.at(-1).cursor)} className="min-h-12 underline">Older feedback</button>}</>}</section>;
}
