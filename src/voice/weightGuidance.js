import { reviewCopy } from './reviewGuidance.js';
import { weightReference } from '../utils/weightReference.js';
import { numberParts, audioUnits } from './reportAudio.js';
export function weightGuidance(data, language='en') {
 const lang=['en','hi','bn'].includes(language)?language:'en',w=reviewCopy[lang],r=weightReference(data);
 if(!r)return [w.unavailable];
 return [w.range,...numberParts(r.lower,lang),audioUnits[lang].kg,w.upper,...numberParts(r.upper,lang),audioUnits[lang].kg,
  ...(r.direction==='within'?[w.within]:r.gap===0?[w.boundary]:[w[r.direction],...numberParts(r.gap,lang),audioUnits[lang].kg]),w.limits];
}
