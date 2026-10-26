import DeliveryHelp from '../components/DeliveryHelp';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CommerceHeader from '../components/CommerceHeader';
import {Package,Check,AlertTriangle} from 'lucide-react';
import './KioskCommerce.css';
import SpokenGuide from '../components/SpokenGuide';
import { useHealth } from '../context/HealthContext';
import { useVoicePage } from '../hooks/useVoicePage';
import { useSpeech } from '../context/SpeechContext';
import { API_BASE } from '../config/api';
import { readBrowserStorage } from '../utils/browserStorage';
import { requestJSON } from '../utils/request';
import { deliveryState, medicineGuide } from '../voice/medicineGuide';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useHealth();
  const { speakText } = useSpeech();
  const language = data.language || 'en';
  const w = medicineGuide[language] || medicineGuide.en;
  const sessionId = location.state?.sessionId || readBrowserStorage('reliv_session_id') || readBrowserStorage('reliv_session_id', 'sessionStorage');
  const [state, setState] = useState('checking');
  const [snapshot, setSnapshot] = useState(null);
  const [retry, setRetry] = useState(0);
  const [delayed, setDelayed] = useState(false);
  const visibleState = delayed && ['checking','waiting','dispensing','offline'].includes(state) ? 'review' : state;
  const instruction = w[`${visibleState}Text`];
  useVoicePage({ onHelp: () => speakText(instruction, {langHint:language}), idleEnabled:false });
  useEffect(() => {
    setState('checking'); setSnapshot(null);
    if (!sessionId) { setState('unknown'); return undefined; }
    const controller = new AbortController();
    let pollTimer;
    const poll = async () => {
      let next = 'offline';
      try {
        const status = await requestJSON(`${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/status`, { signal:controller.signal, timeoutMs:8000, cache:'no-store' });
        if (controller.signal.aborted) return;
        next = deliveryState(status, sessionId);
        setSnapshot(status); setState(next);
      } catch {
        if (controller.signal.aborted) return;
        setState('offline'); setSnapshot(null);
      }
      if (!['complete','review','unknown'].includes(next)) pollTimer = setTimeout(poll, 2000);
    };
    void poll();
    return () => { controller.abort(); clearTimeout(pollTimer); };
  }, [sessionId, retry]);
  useEffect(() => {
    setDelayed(false);
    const timer = setTimeout(() => setDelayed(true), 90000);
    return () => clearTimeout(timer);
  }, [sessionId]);
  return <main className="commerce-screen">
    <CommerceHeader language={language} step={2}/>
    <section className="commerce-order" data-state={visibleState}>
      <div className="commerce-order-icon" aria-hidden="true">{state==='complete'?<Check size={36}/>:visibleState==='review'?<AlertTriangle size={36}/>:<Package size={36}/>}</div>
      <p className="mt-5 text-orange-800">{w.title}</p>
      <h1 className="mt-2 text-3xl font-bold" role="status">{w[visibleState]}</h1>
      <SpokenGuide text={instruction} language={language} autoSpeak />
      {snapshot?.jobsCount > 0 && <p className="commerce-order-count">{Number.isInteger(snapshot.itemsCount)?w.itemsConfirmed:w.confirmed}: {snapshot.itemsCompleted ?? snapshot.jobsCompleted} / {snapshot.itemsCount ?? snapshot.jobsCount}</p>}
      {delayed && ['waiting','dispensing','offline'].includes(state) && <p className="rounded-xl bg-amber-100 p-4" role="alert">{w.delayed}</p>}
      <p className="commerce-reference">{w.reference}: {sessionId || '—'}</p>
      {state === 'complete' ? <button type="button" onClick={() => { navigate('/feedback', {replace:true,state:{medicineOrder:true,language}}); }} className="commerce-primary">{w.finish}</button>
        : <button type="button" onClick={() => setRetry(n=>n+1)} className="commerce-quiet">{w.retry}</button>}
      <DeliveryHelp key={sessionId} sessionId={sessionId} language={language} />
    </section>
  </main>;
}

