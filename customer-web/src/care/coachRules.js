// Review helpers, not a medical or religious certification engine.
const clean = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
export function foodRestriction(name,p={}) {
  const s=clean(name), meat=/\b(meat|beef|veal|cow|bull|buffalo|mutton|lamb|goat|pork|bacon|ham|lard|chicken|poultry|turkey|duck|fish|seafood|prawn|shrimp|salmon|tuna|crab|lobster)\b/;
  const ingredients=s.replace(/\b(cow|buffalo|bovine) (milk|mozzarella|curd|yogurt|cheese)\b/g,'dairy');
  if(p.noBeef && /\b(beef|veal|cow|bull|buffalo|bovine)\b/.test(ingredients))return 'This food does not match your no-beef preference. Choose an alternative or review your preferences.';
  if(p.noPork && /\b(pork|bacon|ham|lard|swine|pancetta|prosciutto)\b/.test(s))return 'This food does not match your no-pork preference. Choose an alternative or review your preferences.';
  if(['pure_veg','veg','partial_veg'].includes(p.diet)&&meat.test(ingredients))return 'This food does not match your vegetarian preference. Check the ingredients or choose an alternative.';
  if(['pure_veg','veg'].includes(p.diet)&&/\beggs?\b/.test(s))return 'Your selected vegetarian preference excludes eggs.';
  return null;
}
export function consumptionIntent(text) {
 const s=clean(text);
 if(/[?？]/.test(text)||/^(how|what|can|should|could|does|is|kitna|kitni|koto)\b/.test(s)||/\b(did not|didn t|haven t|have not|will|planning|plan to|want to|didnt|nahi|nahin)\b/.test(s))return false;
 return /\b(ate|eaten|had|drank|consumed|khaya|khayi|khali|kha liya|kha li|peeliya|piya|pee liya|kheyechi|khelam|khaichi|log|record|add)\b/.test(s);
}
export function similar(a,b){a=clean(a).slice(0,120);b=clean(b).slice(0,120);if(!a||!b)return false;let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+Number(a[i-1]!==b[j-1]));row=next;}return 1-row[b.length]/Math.max(a.length,b.length)>=.86;}
export function duplicateMeal(entries,meal,now=Date.now()){return entries.find(e=>e.kind==='meal'&&now-Date.parse(e.at)>=0&&now-Date.parse(e.at)<900000&&similar(e.name,meal.name)&&Math.abs(e.kcal-meal.kcal)<5);}
export function weightAnomaly(entries,value){const v=entries.filter(e=>e.kind==='weight'&&Number.isFinite(e.amount)).slice(-5).map(e=>e.amount).sort((a,b)=>a-b);return v.length===5&&Math.abs(value-v[2])>2.5?`Your last five entries have a median of ${v[2]} kg. Check ${value} kg before saving. This may be a typo or a real change; the app cannot tell which.`:null;}
export function loggingStreak(entries,today){const grouped={};for(const e of entries)(grouped[e.day]||=new Set()).add(e.kind);const complete=new Set(Object.keys(grouped).filter(d=>grouped[d].has('meal')&&grouped[d].has('water')));const d=new Date(today+'T12:00:00');const key=()=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(!complete.has(key()))d.setDate(d.getDate()-1);let count=0;while(complete.has(key())&&count<10000){count++;d.setDate(d.getDate()-1);}return count;}
export function goalProgress(start,current,target){if(![start,current,target].every(Number.isFinite))return 0;if(start===target)return current===target?100:0;return Math.round(Math.max(0,Math.min(100,(current-start)/(target-start)*100)));}
export function weightProjection(entries,target){const days=new Map();for(const e of entries.filter(e=>e.kind==='weight'&&Number.isFinite(e.amount)))days.set(e.day,e.amount);const sorted=[...days].sort(([a],[b])=>a.localeCompare(b));if(sorted.length<6)return null;const last=Date.parse(sorted.at(-1)[0]);const recent=sorted.filter(([d])=>last-Date.parse(d)<7*86400000),prior=sorted.filter(([d])=>{const age=last-Date.parse(d);return age>=7*86400000&&age<14*86400000});if(recent.length<3||prior.length<3)return null;const avg=a=>a.reduce((s,[,v])=>s+v,0)/a.length;const rate=avg(recent)-avg(prior),remaining=target-avg(recent);if(Math.abs(rate)<.1||remaining*rate<=0)return null;const weeks=Math.ceil(remaining/rate);return weeks>0&&weeks<=104?{rate:Math.round(rate*10)/10,weeks}:null;}
