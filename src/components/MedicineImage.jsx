import { useState } from 'react';
export default function MedicineImage({src,alt,className}) {
 const [failed,setFailed]=useState('');
 if(!src||failed===src)return <span role="img" aria-label={`${alt}: photo unavailable`} className="p-2 text-center text-xs text-slate-600">{alt}<br/>Photo unavailable</span>;
 return <img src={src} alt={alt} className={className} onError={()=>setFailed(src)} />;
}
