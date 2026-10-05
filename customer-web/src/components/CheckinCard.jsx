import {storyLayouts,storyFields} from './storyLayout';
import React,{useRef,useState,useEffect} from 'react';
// Sharing is opt-in. Only the paid summary supplies a score/highlight; never share credentials.
export function CheckinCard({onChange, summary}) {
 const canvas=useRef(null),[alias,setAlias]=useState(''),[partner,setPartner]=useState(''),[relationship,setRelationship]=useState('solo'),[consent,setConsent]=useState(false),[error,setError]=useState('');
 const solo=relationship==='solo';
 const [art,setArt]=useState(null);
 useEffect(()=>{let active=true;setArt(null);setError('');const image=new Image();image.onload=()=>{if(active)setArt({image,relationship});};image.onerror=()=>{if(active)setError('The card design could not load. Refresh before saving.');};image.src=`/story-cards/${relationship}.jpeg`;return()=>{active=false;};},[relationship]);
 useEffect(()=>{if(summary?.name)setAlias(String(summary.name).slice(0,20));setConsent(false);},[summary?.name]);
 const ready=consent&&art?.relationship===relationship&&alias.trim().length>0&&(solo||partner.trim().length>0);
 useEffect(()=>{onChange(ready?{alias:alias.trim(),partner:partner.trim(),relationship,consent:true}:null);},[alias,partner,relationship,consent,ready,onChange]);
 useEffect(()=>{
  const c=canvas.current,ctx=c?.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,900,1600);
  if(art?.relationship!==relationship)return;
  ctx.drawImage(art.image,0,0,900,1600);
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
 return <section className="rounded-3xl border border-orange-200 bg-orange-50 p-5 space-y-4" aria-label="Optional Reliv story card">
  <h3 className="text-xl font-bold text-slate-900">Your Reliv story card</h3><p className="text-sm text-slate-700">Choose Individual, Friends or Couple. Your name, available score and today’s highlight come from this paid check-in. You can edit the display name.</p>
  <select aria-label="Card type" value={relationship} onChange={e=>{setRelationship(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border p-3"><option value="solo">Individual</option><option value="friends">Friends</option><option value="couple">Couple</option></select>
  <input aria-label="Your nickname" placeholder="Your nickname" maxLength={20} value={alias} onChange={e=>{setAlias(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border p-3"/>
  {!solo && <input aria-label="Their nickname" placeholder="Their nickname" maxLength={20} value={partner} onChange={e=>{setPartner(e.target.value);setConsent(false);}} className="min-h-12 w-full rounded-xl border p-3"/>}
  {!solo&&<p className="text-sm text-slate-700">Your friend or partner’s name does not link their report. Their score is shown as — until a verified second-report linking flow is available. Today’s Win belongs to your named scan only.</p>}
  {!art&&<p role="status">Loading your selected design…</p>}
  <canvas ref={canvas} width="900" height="1600" className="mx-auto w-full max-w-64 rounded-2xl" aria-label="Preview of your optional story card"/>
  <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 h-5 w-5"/>{solo?'I agree to include my nickname and available score and highlight on this shareable card.':'We both agree to use these names and my available score and highlight on this card.'} Include it with my report email when I send the report below.</label>
  <div className="flex gap-3"><button type="button" disabled={!ready} onClick={()=>save(false)} className="min-h-12 rounded-xl bg-orange-800 px-4 font-bold text-white disabled:opacity-40">Save card</button><button type="button" disabled={!ready} onClick={()=>save(true)} className="min-h-12 rounded-xl border border-orange-800 px-4 font-bold disabled:opacity-40">Share card</button></div>
  <p className="text-xs text-slate-600">You choose where to post and whom to tag. A Reliv repost or tag-back is not automatic. If your report was already emailed, save or share this card directly.</p>{error&&<p role="alert">{error}</p>}
 </section>;
}

