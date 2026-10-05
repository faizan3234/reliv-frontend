import { reviewCopy } from '../voice/reviewGuidance';
import { weightReference } from '../utils/weightReference';
export default function WeightReferenceCard({data,language='en'}) {
 const w=reviewCopy[language]||reviewCopy.en,r=weightReference(data);
 return <section className="mx-auto my-5 max-w-4xl rounded-2xl border border-orange-200 bg-orange-50 p-5" aria-label={w.title}>
  <h2 className="text-xl font-bold">{w.title}</h2>
  {r?<><p className="mt-3">{w.range} <strong>{r.lower} kg</strong> {w.upper} <strong>{r.upper} kg</strong>.</p><p className="mt-3 font-semibold">{r.direction==='within'?w.within:r.gap===0?w.boundary:<>{w[r.direction]} {r.gap} kg.</>}</p><p className="mt-3 text-sm">{w.limits}</p></>:<p className="mt-3">{w.unavailable}</p>}
 </section>;
}
