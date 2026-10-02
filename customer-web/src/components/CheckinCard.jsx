import React,{useRef,useState,useEffect} from 'react';
// Sharing is opt-in. Never put private readings, payment IDs, PINs or codes on a story.
export function CheckinCard({onChange}) {
 const canvas=useRef(null),[alias,setAlias]=useState(''),[partner,setPartner]=useState(''),[relationship,setRelationship]=useState('friends'),[consent,setConsent]=useState(false),[error,setError]=useState('');
 const ready=consent&&alias.trim().length>0&&partner.trim().length>0;
 useEffect(()=>{onChange(ready?{alias:alias.trim(),partner:partner.trim(),relationship,consent:true}:null);},[alias,partner,relationship,consent,ready,onChange]);
 useEffect(()=>{
  const c=canvas.current,ctx=c?.getContext('2d');if(!ctx)return;
  const gradient=ctx.createLinearGradient(0,0,1080,1920);gradient.addColorStop(0,'#0f172a');gradient.addColorStop(.55,'#312e81');gradient.addColorStop(1,'#9a3412');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1920);
  ctx.fillStyle='#fb923c';ctx.beginPath();ctx.arc(1000,100,340,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fdba74';ctx.font='bold 60px Arial';ctx.fillText('RELIV',90,150);
  ctx.fillStyle='#ffffff';ctx.font='bold 82px Arial';ctx.fillText('BETTER HABITS.',90,400);ctx.fillText('TOGETHER.',90,500);
  ctx.fillStyle='#fde68a';ctx.font='bold 36px Arial';ctx.fillText(relationship==='couple'?'OUR COUPLE CHECK-IN':'OUR FRIEND CHECK-IN',90,615);
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(80,750,920,530);
  ctx.fillStyle='#ffffff';ctx.font='bold 58px Arial';ctx.fillText(alias.trim()||'Your nickname',120,900,840);ctx.fillText('&',120,990);ctx.fillText(partner.trim()||'Their nickname',120,1080,840);
  ctx.fillStyle='#fed7aa';ctx.font='36px Arial';ctx.fillText('We are making time for our health.',120,1190,840);
  ctx.fillStyle='#ffffff';ctx.font='bold 46px Arial';ctx.fillText('THE WIN: SHOWING UP.',90,1460);
  ctx.font='32px Arial';ctx.fillText('A shared intention. No medical rankings.',90,1540);ctx.fillText('Choose a habit. Encourage each other.',90,1600);
  ctx.fillStyle='#fdba74';ctx.font='bold 34px Arial';ctx.fillText('#RelivTogether',90,1790);
 },[alias,partner,relationship]);
 const getBlob=()=>new Promise((resolve,reject)=>canvas.current.toBlob(b=>b?resolve(b):reject(new Error('Could not create card.')),'image/png'));
 const save=async(share)=>{if(!ready)return;setError('');try{const blob=await getBlob(),file=new File([blob],'Reliv-Together.png',{type:'image/png'});if(share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Reliv Together'});return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){if(e.name!=='AbortError')setError('Could not share. Try Save card.');}};
 return <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 space-y-4" aria-label="Optional friend or couple story card">
  <h3 className="text-xl font-bold text-slate-900">Make a friend / couple story card</h3><p className="text-sm text-slate-700">A friendly invitation to build habits together. No health scores, readings or medical winners are published.</p>
  <select aria-label="Card type" value={relationship} onChange={e=>{setRelationship(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border p-3"><option value="friends">Friends</option><option value="couple">Couple</option></select>
  <input aria-label="Your nickname" placeholder="Your nickname" maxLength={20} value={alias} onChange={e=>{setAlias(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border p-3"/>
  <input aria-label="Their nickname" placeholder="Their nickname" maxLength={20} value={partner} onChange={e=>{setPartner(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border p-3"/>
  <canvas ref={canvas} width="1080" height="1920" className="mx-auto w-full max-w-64 rounded-2xl" aria-label="Preview of your optional story card"/>
  <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 h-5 w-5"/>We both agree to use these nicknames on this card. Include it with my report email when I send the report below.</label>
  <div className="flex gap-3"><button type="button" disabled={!ready} onClick={()=>save(false)} className="min-h-12 rounded-xl bg-indigo-800 px-4 font-bold text-white disabled:opacity-40">Save card</button><button type="button" disabled={!ready} onClick={()=>save(true)} className="min-h-12 rounded-xl border border-indigo-800 px-4 font-bold disabled:opacity-40">Share card</button></div>
  <p className="text-xs text-slate-600">You choose where to post and whom to tag. A Reliv repost or tag-back is not automatic. If your report was already emailed, save or share this card directly.</p>{error&&<p role="alert">{error}</p>}
 </section>;
}
