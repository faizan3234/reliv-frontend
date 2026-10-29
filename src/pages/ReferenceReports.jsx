import DeliveryHelp from '../components/DeliveryHelp';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import SpeechControl from '../components/SpeechControl';
import WeightReferenceCard from '../components/WeightReferenceCard';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHealth } from '../context/HealthContext';
import { getScanCount } from '../utils/reportSnapshot';
import Report1 from './Report1';
import Report2 from './Report2';
import Report3 from './Report3';
import Report4 from './Report4';
import Report5 from './Report5';
import '../styles/report.css';
import '../styles/referenceReports.css';

// Render only beneath ProtectedReportRoute. No history-by-email or cloud reads.
export default function ReferenceReports() {
 const {data}=useHealth();
 const navigate=useNavigate();
 const lang=data.language || "en";
 const [spokenLanguage,setSpokenLanguage]=useState(data.reportSpeechLanguage||lang);
 useEffect(()=>{const changed=event=>{if(['en','hi','bn'].includes(event.detail))setSpokenLanguage(event.detail);};window.addEventListener('reliv_report_language_change',changed);return()=>window.removeEventListener('reliv_report_language_change',changed);},[]);
 const {pathname}=useLocation();
 const page=Math.min(5,Math.max(1,Number(pathname.match(/report-(\d)/)?.[1])||1));
 const reportRoot=useRef(null);
 // Reset every scroll ancestor before painting the next report page.
 useLayoutEffect(()=>{reportRoot.current?.scrollIntoView?.({block:"start",behavior:"instant"});},[page]);
 const count=getScanCount(data);
 const tabs={en:['Overview','Body balance','Body profile','Your trends','Next steps'],hi:['एक नज़र','शरीर का संतुलन','शरीर की जानकारी','पिछले स्कैन','आगे क्या करें'],bn:['এক নজরে','শরীরের ভারসাম্য','শরীরের তথ্য','আগের স্ক্যান','এরপর কী করবেন']}[lang]||['Overview','Body balance','Body profile','Your trends','Next steps'];
 const Page=[Report1,Report2,Report3,Report4,Report5][page-1];
 return <main ref={reportRoot} className="reference-reports" aria-label="Health screening report">
  <header className="reference-progress"><div><small className="reference-person">{data.patient?.name || "Your health report"}</small><strong>Scan {count} · Report {page} / 5</strong></div><span>{count<7?`${7-count} scans left in your seven-scan journey`:'✓ Seven-scan journey complete'}</span><SpeechControl inline/></header>
  <nav className="reference-page-track" aria-label="Report pages">{tabs.map((label,index)=><button key={label} type="button" aria-current={index+1===page?"page":undefined} onClick={()=>navigate(`/report-${index+1}`)}><span>{index+1}</span>{label}</button>)}</nav>
  {page>1 && <nav className="reference-back"><button type="button" onClick={()=>{navigate(`/report-${page-1}`);window.scrollTo(0,0);}}>← {lang==="hi"?"पिछला पेज":lang==="bn"?"আগের পাতা":"Previous page"}</button></nav>}
  <p className="reference-note">{lang==="hi"?"यह स्वास्थ्य की शुरुआती जाँच है। शरीर के स्कोर, चर्बी, मांसपेशियों और कैलोरी के आँकड़े अनुमान हैं, बीमारी का निदान नहीं।":lang==="bn"?"এটি স্বাস্থ্যের প্রাথমিক পরীক্ষা। শরীরের স্কোর, চর্বি, পেশি ও ক্যালোরির হিসাব আনুমানিক, রোগ নির্ণয় নয়।":"Health screening, not a diagnosis. Body score, body fat, muscle, bone mass and calorie figures are calculated estimates."}</p>
  {(page===1||page===2||page===5)&&<details className="reference-weight-details"><summary>{lang==='hi'?'मेरी लंबाई के हिसाब से वज़न की जानकारी':lang==='bn'?'আমার উচ্চতা অনুযায়ী ওজনের তথ্য':'Weight range for my height'} <span aria-hidden="true">+</span></summary><WeightReferenceCard data={data} language={spokenLanguage}/></details>}
  <div className="reference-report-content"><Page key={`${data.sessionId}-${page}`} /></div>
  <DeliveryHelp key={data.sessionId} sessionId={data.sessionId} language={lang} />
 </main>;
}
