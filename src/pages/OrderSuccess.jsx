import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
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
  const { data, resetHealth } = useHealth();
  const { speakText } = useSpeech();
  const language = data.language || 'en';
  const w = medicineGuide[language] || medicineGuide.en;
  const sessionId = location.state?.sessionId || readBrowserStorage('reliv_session_id') || readBrowserStorage('reliv_session_id', 'sessionStorage');
  const [state, setState] = useState('checking');
  const [snapshot, setSnapshot] = useState(null);
  const [retry, setRetry] = useState(0);
  const [delayed, setDelayed] = useState(false);
  const instruction = w[`${state}Text`];
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
    const timer = setTimeout(() => setDelayed(true), 90000);
    return () => clearTimeout(timer);
  }, [sessionId]);
  return <main className="min-h-screen touch-pan-y bg-orange-50 px-5 py-10 text-slate-900">
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
      <Logo />
      <p className="mt-5 text-orange-800">{w.title}</p>
      <h1 className="mt-2 text-3xl font-bold" role="status">{w[state]}</h1>
      <SpokenGuide text={instruction} language={language} autoSpeak />
      {snapshot?.jobsCount > 0 && <p className="my-4 text-xl">{w.confirmed}: {snapshot.jobsCompleted} / {snapshot.jobsCount}</p>}
      {delayed && ['waiting','dispensing','offline'].includes(state) && <p className="rounded-xl bg-amber-100 p-4" role="alert">{w.delayed}</p>}
      <p className="my-4 break-all text-sm text-slate-600">{w.reference}: {sessionId || '—'}</p>
      {state === 'complete' ? <button type="button" onClick={() => { resetHealth(); navigate('/feedback', {replace:true}); }} className="min-h-14 w-full rounded-xl bg-orange-700 px-5 py-4 font-bold text-white">{w.finish}</button>
        : <button type="button" onClick={() => setRetry(n=>n+1)} className="min-h-14 rounded-xl border border-orange-400 px-5 py-4 font-bold">{w.retry}</button>}
    </section>
  </main>;
}
