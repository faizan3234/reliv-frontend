import React, { useState, useEffect, useRef } from 'react';
import { readVault, vaultExists, legacyRecordsExist, exportVault, setAutoSave, deleteRecord } from '../services/reportVault';
const labels = { systolic: 'BP systolic (mmHg)', diastolic: 'BP diastolic (mmHg)', oxygen: 'Oxygen (%)', bpm: 'Pulse (bpm)', temperature: 'Temperature (°F)', weight: 'Weight (kg)', height: 'Height (cm)', bodyFat: 'Body fat estimate (%)', bodyWater: 'Body water estimate (%)', muscleMass: 'Muscle mass estimate', boneMass: 'Bone mass estimate' };
export function MyRecords() {
    const [available, setAvailable] = useState(() => { try { return vaultExists(); } catch { return false; } });
    const [open, setOpen] = useState(false), [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [profile, setProfile] = useState('');
    const pending = useRef(false);
    useEffect(() => {
        const update = () => { try { if (vaultExists()) setAvailable(true); setData(readVault()); } catch { setData(null); } };
        const external = () => update();
        window.addEventListener('reliv-records-changed', update); window.addEventListener('storage', external);
        return () => { window.removeEventListener('reliv-records-changed', update); window.removeEventListener('storage', external); };
    }, []);
    const action = async operation => {
        if (pending.current) return; pending.current = true; setBusy(true); setError('');
        try { await operation(); } catch (e) { setError(e.message); } finally { pending.current = false; setBusy(false); }
    };
    const groups = [...new Set((data?.records || []).map(r => r.profileKey))], selected = groups.includes(profile) ? profile : groups[0];
    const records = (data?.records || []).filter(r => r.profileKey === selected).sort((a, b) => a.scanNumber - b.scanNumber || a.recordedAt - b.recordedAt);
    const backup = () => action(() => {
        const url = URL.createObjectURL(new Blob([exportVault()], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'reliv-health-records.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    if (!available) return null;
    return <section className="rounded-2xl border border-orange-200 bg-white p-4 space-y-3">
        <button type="button" className="min-h-12 w-full font-semibold" onClick={() => { setOpen(!open); try { setData(readVault()); } catch (e) { setError(e.message); } }}>My saved health records</button>
        {open && data && <><button type="button" disabled={busy} className="min-h-12 px-4 border rounded-lg" onClick={backup}>Download records backup</button>
            <p className="text-xs">Saved on this phone without a password. Anyone using the unlocked phone can view these records. Keep a backup before clearing app data.</p>
            {legacyRecordsExist() && <p className="text-xs">Older encrypted records remain untouched. They cannot be read here without their original password.</p>}
            {!records.length && <p>No scans saved yet. Use Save to my app after a paid checkup.</p>}
            {groups.length > 0 && <label className="block">Person<select value={selected} onChange={e => setProfile(e.target.value)} className="block w-full min-h-12 border rounded-lg">{groups.map((key, i) => <option key={key} value={key}>{data.records.find(r => r.profileKey === key)?.patient?.name || 'Unnamed'} · Profile {i + 1}</option>)}</select></label>}
            {selected && <label className="flex gap-3"><input type="checkbox" disabled={busy} checked={data.autoProfiles.includes(selected)} onChange={e => { const checked = e.target.checked; void action(() => setAutoSave(selected, checked)); }} />Auto-save this profile’s later paid scans on this phone</label>}
            {records.map((record, index) => <article key={record.id} className="border rounded-xl p-3 space-y-2 break-words"><h3 className="font-bold">Scan {record.scanNumber} · {record.patient.name || 'My checkup'}</h3><p className="text-sm">{record.kioskId} · {new Date(record.recordedAt).toLocaleDateString()}</p><p>Body score estimate: {record.summary?.score ?? 'Unavailable'} / 100</p><p>{record.summary?.win}</p>
                <dl>{Object.entries(labels).filter(([key]) => record.vitals[key] !== undefined && record.vitals[key] !== null && record.vitals[key] !== '').map(([key, label]) => <div key={key} className="flex justify-between gap-2 py-1 border-b"><dt>{label}</dt><dd>{String(record.vitals[key])}{index > 0 && records[index - 1].vitals[key] != null && records[index - 1].vitals[key] !== '' && <span className="block text-xs text-slate-500">Previous: {String(records[index - 1].vitals[key])}</span>}</dd></div>)}</dl>
                <p className="text-xs">{record.summary?.focus || ''} Calculated estimates are not direct measurements or a diagnosis.</p>
                <button type="button" disabled={busy} className="min-h-11 text-red-800" onClick={() => { if (window.confirm('Delete this saved scan from this phone?')) void action(() => deleteRecord(record.id)); }}>Delete saved scan</button>
            </article>)}
        </>}
        {open && error && <p role="alert">{error}</p>}
    </section>;
}

