import {useEffect,useRef} from 'react';
import Logo from './Logo';
import {commerceCopy} from './CommerceHeader';
// Visual transition only. Never claim UV disinfection without a verified hardware cycle.
export default function UVCleansingAnimation({onComplete,language='en'}){
 const completed=useRef(false);const c=commerceCopy[language]||commerceCopy.en;
 const finish=()=>{if(!completed.current){completed.current=true;onComplete?.();}};
 useEffect(()=>{const timer=setTimeout(()=>{if(!completed.current){completed.current=true;onComplete?.();}},3000);return()=>clearTimeout(timer);},[onComplete]);
 return <section className="commerce-feedback"><div className="commerce-reset-logo"><Logo size="text-6xl"/></div><h1>{c.reset}</h1><p>{c.transition}</p><button className="commerce-quiet" onClick={finish}>{c.home} →</button></section>;
}
