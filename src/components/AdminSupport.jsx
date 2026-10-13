import {useRef,useState} from 'react';
import {adminFetch} from '../utils/adminSession';
import {API_BASE} from '../config/api';
export default function AdminSupport(){
 const [open,setOpen]=useState(false),[reference,setReference]=useState(''),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState(''),[status,setStatus]=useState('INVESTIGATING');
 const pending=useRef(false);
 async function load(ref=reference){
  if(pending.current)return;pending.current=true;setBusy(true);setError('');setResult(null);
  try{const r=await adminFetch(`${API_BASE}/api/admin/support?reference=${encodeURIComponent(ref.trim())}`,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||d.message||'Cannot load records.');setResult(d);}catch(e){setError(e.message);}finally{pending.current=false;setBusy(false);}
 }
 async function save(){
  if(pending.current||!result?.complaint)return;pending.current=true;setBusy(true);setError('');let done=false;
  try{const r=await adminFetch(`${API_BASE}/api/admin/support/${encodeURIComponent(result.complaint.case_id)}/notes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,note})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Cannot save note.');setNote('');done=true;}catch(e){setError(e.message);}finally{pending.current=false;setBusy(false);}
  if(done)await load(result.complaint.case_id);
 }
 async function openCase(){
  if(pending.current)return;pending.current=true;setBusy(true);setError('');let ref;
  try{const r=await adminFetch(`${API_BASE}/api/admin/support`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:result.evidence.session.session_id})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Cannot open case.');ref=d.case.case_id;}catch(e){setError(e.message);}finally{pending.current=false;setBusy(false);}
  if(ref)await load(ref);
 }
 function download(){
  const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='reliv-order-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 const e=result?.evidence;
 return <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 break-words">
  <button type="button" aria-expanded={open} className="min-h-12 text-left text-lg font-bold" onClick={()=>{setOpen(!open);if(!open)void load('');}}>Customer help & order evidence</button>
  {open&&<>
   <p className="text-sm">Local records from this Pi. Match the receipt’s order/payment reference; kiosk ID alone cannot identify a purchase.</p>
   <form onSubmit={event=>{event.preventDefault();void load();}} className="space-y-2"><label className="block">Case, session, transaction, payment or request ID<input value={reference} maxLength={120} onChange={event=>setReference(event.target.value)} className="w-full rounded-lg border p-3"/></label><button disabled={busy} className="min-h-12 rounded-lg bg-orange-700 px-4 text-white disabled:opacity-50">Find order / refresh</button></form>
   {busy&&<p role="status">Loading…</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
   {result?.cases?.length===0&&<p>No help requests saved here yet.</p>}
   {result?.cases?.map(c=><button key={c.case_id} disabled={busy} onClick={()=>{setReference(c.case_id);void load(c.case_id);}} className="block w-full rounded-xl border p-3 text-left"><strong>{c.kind} · {c.status}</strong><br/><span className="break-all">{c.case_id}</span><br/>{c.created_at} UTC</button>)}
   {e&&<>
    <button onClick={download} className="min-h-12 rounded-lg border p-3">Download evidence for support</button><p className="text-sm">Contains order records and staff notes. Share privately with authorised support only.</p>
    <h3 className="font-bold">{e.session.kiosk_id} · {e.session.service_type}</h3><p className="break-all">{e.session.session_id}</p>
    <p className="rounded-xl bg-amber-50 p-3 text-sm">{e.limitations}</p>
    <h4 className="font-bold">Payment records</h4>
    {!e.payments.length&&<p>No local payment record. Check the customer’s receipt with the payment bridge before deciding.</p>}
    {e.payments.map(p=><div key={p.transaction_id} className="rounded-xl border p-3 text-sm"><strong>₹{p.amount} · {p.status}</strong><p className="break-all">{p.transaction_id}</p><p>Verified: {p.verified_at||'Not verified locally'}</p><p className="break-all">Payment: {p.provider_payment_id||'Match using request ID / bridge receipt'}</p>{Array.isArray(p.cart)&&<pre className="whitespace-pre-wrap break-all">{JSON.stringify(p.cart,null,2)}</pre>}</div>)}
    {e.requests.map(r=><p key={r.request_id} className="break-all text-sm">Request: {r.request_id} · {r.status}</p>)}
    <h4 className="font-bold">Dispenser records</h4>{!e.jobs.length&&<p>No dispenser jobs recorded.</p>}
    {e.jobs.map(j=><div key={j.job_id} className="space-y-1 rounded-xl border p-3 text-sm"><strong>{j.item_name||j.kit_id} · {j.quantity} ordered · Motor {j.motor_id}</strong><p>{j.state==='COMPLETED'?'Device reported completion (collection not proven)':j.state}</p><p>Command: {j.mqtt_published_at||'No broker confirmation'}</p><p>Device reply: {j.esp32_ack_received_at||'None recorded'}</p><p className="text-red-700">{j.error_message}</p><p>Stock counter now: {j.recorded_stock_now??'Unknown'} (not a physical count)</p><details><summary className="min-h-10">Device reply details</summary><pre className="whitespace-pre-wrap break-all">{JSON.stringify(j.esp32_ack_payload,null,2)}</pre></details></div>)}
    {e.failures?.map((f,i)=><p key={i} className="rounded-lg bg-red-50 p-3 text-sm">{f.created_at} UTC · {f.event_type}<br/>{f.error_message}</p>)}
    {!result.complaint&&<button disabled={busy} onClick={openCase} className="min-h-12 rounded-lg border p-3">Open case for this phone / email complaint</button>}
    <h4 className="font-bold">Report: {e.session.report_status}</h4>{e.reports.map(r=><p key={r.report_id}>{r.status} · {r.created_at} UTC. Generation/email status does not prove receipt.</p>)}
    <details><summary className="min-h-10">Backend starts since this order ({e.restarts.length})</summary>{e.restarts.map((r,i)=><p key={i}>{r.created_at} UTC — cause unknown</p>)}</details>
    {result.complaint&&<><h4 className="font-bold">Case: {result.complaint.status}</h4>{result.notes.map(n=><p key={n.note_id} className="rounded-lg bg-slate-50 p-3 text-sm">{n.created_at} UTC · {n.actor} · {n.status}<br/>{n.note}</p>)}
     <label className="block">Review status<select value={status} onChange={ev=>setStatus(ev.target.value)} className="w-full border p-3"><option>OPEN</option><option>INVESTIGATING</option><option>RESOLVED</option></select></label>
     <label className="block">Staff findings / action taken<textarea maxLength={1500} value={note} onChange={ev=>setNote(ev.target.value)} className="w-full border p-3"/></label><p className="text-sm">Saving a note does not refund, dispense or resend a report. Record what you actually checked and did.</p><button disabled={busy||note.trim().length<5} onClick={save} className="min-h-12 rounded-lg bg-orange-700 px-4 text-white disabled:opacity-50">Save review note</button>
     <details><summary className="min-h-10">Original evidence when request was saved</summary><pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(result.complaint.evidence_json,null,2)}</pre></details>
    </>}
   </>}
  </>}
 </section>;
}
