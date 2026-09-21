import React, { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config/api';
import { adminFetch } from '../utils/adminSession';

export default function AdminAdSettings() {
  const [interval, setInterval] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const controller = useRef(null);
  useEffect(() => {
    const abort = new AbortController(); controller.current = abort;
    adminFetch(`${API_BASE}/api/ads/config`, { signal: abort.signal, cache: 'no-store' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok || ![5, 10, 15].includes(data.splashIntervalSeconds)) throw new Error('Ad settings unavailable. Reload to retry.');
        if (!abort.signal.aborted) setInterval(data.splashIntervalSeconds);
      }).catch(error => { if (!abort.signal.aborted) setMessage(error.message); });
    return () => abort.abort();
  }, []);
  const save = async value => {
    if (busy || value === interval) return;
    setBusy(true); setMessage('');
    const signal = controller.current.signal;
    try {
      const response = await adminFetch(`${API_BASE}/api/ads/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, signal,
        body: JSON.stringify({ splashIntervalSeconds: value }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || data.splashIntervalSeconds !== value) throw new Error(data.message || 'Setting was not saved. Retry.');
      if (!signal.aborted) { setInterval(value); setMessage('Saved on this kiosk.'); }
    } catch (error) { if (!signal.aborted) setMessage(error.message); }
    finally { if (!signal.aborted) setBusy(false); }
  };
  return <section className="bg-white rounded-2xl p-4 border border-slate-200">
    <h2 className="font-bold text-base">Ad display settings</h2>
    <p className="text-sm text-slate-600 mt-1 mb-3">Show the original splash screen for this long between ads.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Splash interval">
      {[5, 10, 15].map(value => <button key={value} type="button" aria-pressed={interval === value} disabled={busy || interval === null}
        className={`min-h-12 rounded-xl px-4 py-3 border font-semibold disabled:opacity-50 ${interval === value ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700 border-slate-300'}`}
        onClick={() => save(value)}>{value} seconds</button>)}
    </div>
    <p className="text-xs text-slate-500 mt-3">With no active ads, only the original splash screen appears.</p>
    {message && <p role="status" className="text-sm mt-3">{message}</p>}
  </section>;
}
