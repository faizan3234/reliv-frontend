import React, { useEffect, useState } from 'react';
import { readVault } from '../services/reportVault';

export function MyHealth({ onScan, onRecords }) {
  const [data, setData] = useState({ records: [] });
  const [profile, setProfile] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => { try { setData(readVault()); setError(''); } catch (e) { setError(e.message); } };
    refresh();
    window.addEventListener('reliv-records-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('reliv-records-changed', refresh); window.removeEventListener('storage', refresh); };
  }, []);
  const groups = [...new Set(data.records.map(r => r.profileKey))];
  const selected = groups.includes(profile) ? profile : groups[0];
  const records = data.records.filter(r => r.profileKey === selected).sort((a,b) => a.scanNumber - b.scanNumber || a.recordedAt - b.recordedAt);
  const latest = records.at(-1);
  return <section aria-label="My Health" className="space-y-5">
    <header><p className="text-sm font-semibold text-orange-700">YOUR RELIV JOURNEY</p><h1 className="text-3xl font-bold tracking-tight mt-1">My Health</h1><p className="mt-2 text-slate-600">Your latest checkup, with every saved scan kept for comparison.</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {groups.length > 1 && <label className="block text-sm font-semibold">Whose health?<select className="mt-2 w-full min-h-12 rounded-xl border p-3" value={selected} onChange={e=>setProfile(e.target.value)}>{groups.map((key,i)=><option key={key} value={key}>{data.records.find(r=>r.profileKey===key)?.patient?.name || 'My checkup'} · Profile {i+1}</option>)}</select></label>}
    {latest ? <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <p className="text-slate-600 break-words">{latest.patient?.name || 'Your latest checkup'}</p>
      <div className="flex items-end justify-between gap-4 mt-3"><div><p className="text-sm text-slate-500">Latest body score estimate</p><p className="text-5xl font-bold text-orange-700 mt-1">{latest.summary?.score ?? '—'}<span className="text-lg text-slate-500"> /100</span></p></div><span className="rounded-full bg-orange-50 px-3 py-2 text-sm font-semibold">Scan {latest.scanNumber}</span></div>
      <p className="mt-4 text-sm text-slate-600">{records.length} saved {records.length===1?'scan':'scans'} · {new Date(latest.recordedAt).toLocaleDateString()}</p>
      <p className="mt-3 break-words">{latest.summary?.win}</p>
      <button onClick={onRecords} className="mt-5 min-h-12 w-full rounded-xl border border-orange-200 font-semibold text-orange-800">View health records →</button>
      <p className="mt-3 text-xs text-slate-500">A wellness estimate, not a diagnosis.</p>
    </article> : <article className="rounded-3xl bg-white border border-orange-100 p-6"><h2 className="text-xl font-semibold">Start your health journey</h2><p className="mt-2 text-slate-600">Scan your kiosk QR. After your checkup payment, tap “Send my health report to my app”. Your readings will appear here.</p></article>}
    <button onClick={onScan} className="min-h-14 w-full rounded-2xl bg-orange-600 px-5 py-4 text-lg font-semibold text-white">Scan QR code</button>
    <p className="text-xs leading-relaxed text-slate-500">Saved on this phone without a password. Download a backup from Health Records before clearing browser/app data or changing phones.</p>
  </section>;
}
