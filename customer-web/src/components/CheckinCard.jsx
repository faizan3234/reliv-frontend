import React, {useRef, useState, useEffect, useMemo} from 'react';
import html2canvas from 'html2canvas';
import {storyFields} from './storyLayout';
import {storyTemplates} from './storyTemplates';
import './storyCard.css';

export function CheckinCard({onChange, summary}) {
 const preview=useRef(null), frame=useRef(null), saving=useRef(false);
 const [alias,setAlias]=useState(''),[partner,setPartner]=useState(''),[relationship,setRelationship]=useState('solo');
 const [note,setNote]=useState(''),[consent,setConsent]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const solo=relationship==='solo';
 useEffect(()=>{
  const resize=()=>{const scale=Math.min(1,frame.current.clientWidth/420);preview.current.style.transform=`scale(${scale})`;frame.current.style.height=`${preview.current.offsetHeight*scale}px`;};
  const observer=new ResizeObserver(resize);observer.observe(frame.current);observer.observe(preview.current);resize();return()=>observer.disconnect();
 },[]);
 const previewElement=useMemo(()=><div ref={preview} data-design={relationship} className="reliv-story" aria-label="Preview of your optional story card" dangerouslySetInnerHTML={{__html:storyTemplates[relationship]}}/>,[relationship]);
 const ready=consent&&!!alias.trim()&&(solo||!!partner.trim());
 useEffect(()=>{setAlias(String(summary?.name||'').slice(0,30));setConsent(false);},[summary?.name]);
 // The bridge's legacy email renderer does not render these editable HTML designs.
 // Keep report email working without silently attaching a different card.
 useEffect(()=>{onChange(null);},[onChange]);
 useEffect(()=>{
  const node=preview.current;
  const fields=storyFields({alias:alias.trim(),partner:partner.trim(),relationship},summary);
  node.querySelectorAll('[data-field]').forEach(el=>{el.textContent=fields[el.dataset.field]||'';});
  const pill=node.querySelector('#note-pill');
  if(pill) pill.textContent=note.trim()||pill.dataset.default||'Better habits for me. ♡';
 },[alias,partner,relationship,summary,note]);
 const save=async(share)=>{
  if(!ready||saving.current)return;
  saving.current=true;setBusy(true);setError('');
  try {
   await document.fonts?.ready;
   const source=await html2canvas(preview.current,{scale:3,width:420,height:preview.current.offsetHeight,backgroundColor:'#f7f2ea',logging:false,onclone:doc=>{doc.querySelector('.reliv-story').style.transform='none';}});
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
   ctx.fillStyle='#f7f2ea';ctx.fillRect(0,0,1080,1920);
   const scale=Math.min(1080/source.width,1920/source.height),w=source.width*scale,h=source.height*scale;
   ctx.drawImage(source,(1080-w)/2,(1920-h)/2,w,h);
   const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Export unavailable')),'image/png'));
   const file=new File([blob],`Reliv-${relationship}-Story.png`,{type:'image/png'});
   if(share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'My Reliv check-in'});return;}
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){if(e.name!=='AbortError')setError('Could not save your card. Please try Save card image again.');}
  finally{saving.current=false;setBusy(false);}
 };
 const change=(setter)=>(e)=>{setter(e.target.value);setConsent(false);};
 return <section className="rounded-3xl border border-orange-200 bg-white p-4 shadow-sm space-y-4" aria-label="Optional Reliv story card">
  <h3 className="text-xl font-bold text-slate-900">Your Reliv share card</h3>
  <p className="text-sm text-slate-700">Add your name and a personal note. Your available health score and Today’s Win come automatically from this paid report.</p>
  <fieldset disabled={busy} className="space-y-4 min-w-0">
   <label className="block">Card type<select aria-label="Card type" value={relationship} onChange={change(setRelationship)} className="min-h-12 w-full rounded-xl border p-3"><option value="solo">Individual</option><option value="friends">Friends</option><option value="couple">Couple</option></select></label>
   <label className="block">Name to show on the card<input aria-label="Name to show on the card" autoComplete="given-name" placeholder="Type your name" maxLength={30} value={alias} onChange={change(setAlias)} className="min-h-12 w-full rounded-xl border p-3"/></label>
   {!solo&&<label className="block">Friend or partner name<input aria-label="Friend or partner name" placeholder="Type their name" maxLength={30} value={partner} onChange={change(setPartner)} className="min-h-12 w-full rounded-xl border p-3"/></label>}
   <label className="block">My note (optional)<textarea aria-label="My note" maxLength={100} value={note} onChange={change(setNote)} placeholder="Leave blank to use the design’s original note" className="min-h-20 w-full rounded-xl border p-3"/></label>
  </fieldset>
  {!solo&&<p className="text-sm text-slate-700">The score, win and focus belong to {alias.trim()||'your report'}. Entering another name does not link their report; their score stays —.</p>}
  {!summary&&<p role="status">Report details are not available yet. No health score has been invented.</p>}
  <div ref={frame} className="mx-auto w-full max-w-[420px] overflow-hidden">{previewElement}</div>
  <p className="text-xs text-slate-600">Health score is an estimate, not a diagnosis. — means unavailable. Download is a 1080 × 1920 PNG with the complete card, without cropping.</p>
  <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)} className="mt-1 h-5 w-5"/>{solo?'I agree to include my name and report highlights on this shareable card.':'We both agree to include these names and my report highlights on this shareable card.'}</label>
  <div className="flex flex-wrap gap-3"><button type="button" disabled={!ready||busy} onClick={()=>save(false)} className="min-h-12 flex-1 rounded-xl bg-orange-700 px-4 font-bold text-white disabled:opacity-40">{busy?'Creating image…':'Save card image'}</button><button type="button" disabled={!ready||busy} onClick={()=>save(true)} className="min-h-12 flex-1 rounded-xl border border-orange-700 px-4 font-bold text-orange-800 disabled:opacity-40">Share card</button></div>
  <p className="text-xs text-slate-600">Save this card or share it through a supported app. Report email below sends your report and receipt. Instagram reposts are not automatic.</p>
  {error&&<p role="alert">{error}</p>}
 </section>;
}
