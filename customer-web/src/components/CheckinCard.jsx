import {storyLayouts,storyFields} from './storyLayout';
import React,{useRef,useState,useEffect} from 'react';
// Sharing is opt-in. Only the paid summary supplies a score/highlight; never share credentials.
export function CheckinCard({onChange, summary}) {
 const canvas=useRef(null),[alias,setAlias]=useState(''),[partner,setPartner]=useState(''),[relationship,setRelationship]=useState('solo'),[consent,setConsent]=useState(false),[error,setError]=useState('');
 const solo=relationship==='solo';
 const [art,setArt]=useState(null);
 useEffect(()=>{let active=true;setArt(null);setError('');const image=new Image();image.onload=()=>{if(active)setArt({image,relationship});};image.onerror=()=>{if(active)setError('Design artwork is offline; the generated card remains available with a Reliv fallback design.');};image.src=`/story-cards/${relationship}.jpeg`;return()=>{active=false;};},[relationship]);
 useEffect(()=>{if(summary?.name)setAlias(String(summary.name).slice(0,20));setConsent(false);},[summary?.name]);
 const ready=consent&&alias.trim().length>0&&(solo||partner.trim().length>0);
 useEffect(()=>{onChange(ready?{alias:alias.trim(),partner:partner.trim(),relationship,consent:true}:null);},[alias,partner,relationship,consent,ready,onChange]);
 useEffect(()=>{
  const c=canvas.current,ctx=c?.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,900,1600);
  if(art?.relationship===relationship)ctx.drawImage(art.image,0,0,900,1600);
  else {
   const gradient=ctx.createLinearGradient(0,0,900,1600);gradient.addColorStop(0,'#fff7ed');gradient.addColorStop(1,'#ffedd5');ctx.fillStyle=gradient;ctx.fillRect(0,0,900,1600);
   ctx.fillStyle='#c2410c';ctx.font='bold 64px Arial';ctx.textAlign='center';ctx.fillText('RELIV',450,180);
   ctx.font='bold 30px Arial';ctx.fillText(relationship==='solo'?'MY HEALTH CHECK-IN':relationship==='couple'?'OUR COUPLE CHECK-IN':'OUR FRIEND CHECK-IN',450,285);
   ctx.fillStyle='#fff';ctx.fillRect(80,420,740,620);ctx.strokeStyle='#fed7aa';ctx.lineWidth=4;ctx.strokeRect(80,420,740,620);
  }
  const layout=storyLayouts[relationship],fields=storyFields({alias:alias.trim(),partner:partner.trim(),relationship},summary);
  ctx.fillStyle='#29291f';ctx.textAlign='center';
  for(const [key,[x,y,width,size]] of Object.entries(layout)){
   let fontSize=size;ctx.font=`bold ${fontSize}px Arial`;
   while(ctx.measureText(fields[key]).width>width&&fontSize>10){fontSize-=1;ctx.font=`bold ${fontSize}px Arial`;}
   ctx.fillText(fields[key],x,y,width);
  }
  if(!solo){ctx.font='17px Arial';ctx.fillText(fields.winNote,layout.win[0],layout.win[1]+24,layout.win[2]);}
  ctx.font='14px Arial';ctx.fillText('Score is an estimate, not a diagnosis. — = unavailable.',450,1572,720);
 },[alias,partner,relationship,solo,summary,art]);
 const getBlob=()=>new Promise((resolve,reject)=>canvas.current.toBlob(b=>b?resolve(b):reject(new Error('Could not create card.')),'image/png'));
 const save=async(share)=>{if(!ready)return;setError('');try{const blob=await getBlob(),file=new File([blob],'Reliv-Together.png',{type:'image/png'});if(share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Reliv Together'});return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){if(e.name!=='AbortError')setError('Could not share. Try Save card.');}};
 return <section className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm space-y-4" aria-label="Optional Reliv story card">
  <h3 className="text-xl font-bold text-slate-900">Your Reliv share card</h3><p className="text-sm text-slate-700">Choose Individual, Friends or Couple. The name, available score and Today’s Win come from this paid check-in. You can change the display name. The card preview is created as you type.</p>
  <select aria-label="Card type" value={relationship} onChange={e=>{setRelationship(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border p-3"><option value="solo">Individual</option><option value="friends">Friends</option><option value="couple">Couple</option></select>
  <label className="block space-y-1 text-sm font-semibold text-slate-800">Name to show on the card<input aria-label="Name to show on the card" autoComplete="given-name" placeholder="Type your name" maxLength={20} value={alias} onChange={e=>{setAlias(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border border-slate-300 p-3 font-normal"/></label>
  {!solo && <label className="block space-y-1 text-sm font-semibold text-slate-800">Friend or partner name<input aria-label="Friend or partner name" placeholder="Type their name" maxLength={20} value={partner} onChange={e=>{setPartner(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border border-slate-300 p-3 font-normal"/></label>}
  {!solo&&<p className="text-sm text-slate-700">Your friend or partner’s name does not link their report. Their score is shown as — until a verified second-report linking flow is available. Today’s Win belongs to your named scan only.</p>}
  {!art&&<p role="status">Loading your selected design…</p>}
  <canvas ref={canvas} width="900" height="1600" className="mx-auto w-full max-w-64 rounded-2xl" aria-label="Preview of your optional story card"/>
  <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 h-5 w-5"/>{solo?'I agree to put my name and available score and highlight on this shareable card.':'We both agree to put our names and my available score and highlight on this card.'} When checked, the same card is attached to your report email below.</label>
  <div className="flex flex-wrap gap-3"><button type="button" disabled={!ready} onClick={()=>save(false)} className="min-h-12 flex-1 rounded-xl bg-orange-700 px-4 font-bold text-white disabled:opacity-40">Save card image</button><button type="button" disabled={!ready} onClick={()=>save(true)} className="min-h-12 flex-1 rounded-xl border border-orange-700 px-4 font-bold text-orange-800 disabled:opacity-40">Share card</button></div>
  <p className="text-xs text-slate-600">You choose where to post and whom to tag. A Reliv repost or tag-back is not automatic. If your report was already emailed, save or share this card directly.</p>{error&&<p role="alert">{error}</p>}
 </section>;
}
