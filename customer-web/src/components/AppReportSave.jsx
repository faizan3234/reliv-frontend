import React, { useEffect, useRef, useState } from 'react';
import { requestJSON } from '../../../src/utils/request';
import { PAYMENT_API_BASE } from '../services/bridgeApi';
import { readVault, saveRecord, unlockVault, vaultOpen, vaultExists } from '../services/reportVault';
import { InstallApp } from './InstallApp';
export function AppReportSave({ encryptedPackage }) {
    const [enabled, setEnabled] = useState(false), [open, setOpen] = useState(false), [password, setPassword] = useState(''), [auto, setAuto] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
    const lock = useRef(false);
    const transfer = async (automatic = false) => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setMessage('');
        try {
            if (!vaultOpen()) { if (automatic) return; await unlockVault(password); setPassword(''); }
            const result = await requestJSON(`${PAYMENT_API_BASE}/api/v2/app-record`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ package: encryptedPackage }), timeoutMs: 15000, cache: 'no-store' });
            if (!result.ok) throw Error(result.message || 'Report saving is unavailable.');
            const consent = automatic ? readVault().autoProfiles.includes(result.record.profileKey) : auto;
            if (automatic && !consent) return;
            await saveRecord(result.record, consent);
            setMessage(`Scan ${result.record.scanNumber} saved on this phone. Email is separate and optional.`);
        } catch (error) { setMessage(error.message || 'Could not save. Please retry.'); }
        finally { lock.current = false; setBusy(false); }
    };
    const automatic = useRef(transfer); automatic.current = transfer;
    useEffect(() => {
        let active = true; const controller = new AbortController();
        requestJSON(`${PAYMENT_API_BASE}/api/v2/app-features`, { signal: controller.signal, cache: 'no-store', timeoutMs: 10000 }).then(data => {
            if (active && data.appReportSync === true) { setEnabled(true); if (vaultOpen()) void automatic.current(true); }
        }).catch(() => {});
        return () => { active = false; controller.abort(); };
    }, [encryptedPackage]);
    if (!enabled) return null;
    return <section className="rounded-2xl border border-orange-200 bg-white p-4 space-y-3">
        <button type="button" onClick={() => setOpen(!open)} className="min-h-12 w-full rounded-xl bg-orange-700 px-4 py-3 font-bold text-white">Save to my app · report data</button>
        {open && <><p>Save this paid scan as readings and text, not a PDF. Records stay encrypted in this browser/app on this phone, grouped by your private kiosk profile.</p>
            {!vaultOpen() && <label className="block">{(() => { try { return vaultExists(); } catch { return false; } })() ? 'Unlock your records' : 'Create a private password (8+ characters)'}<input type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border p-3" /><span className="text-xs">Keep this password safe. Reliv cannot reset it. Clearing app/browser data removes saved records.</span></label>}
            <label className="flex gap-3 items-start"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} />Auto-save future paid scans for this same profile while my records are unlocked. Each scan still needs its kiosk payment QR.</label>
            <button type="button" disabled={busy} onClick={() => transfer(false)} className="min-h-12 rounded-xl border border-orange-700 px-5 py-3 font-semibold">{busy ? 'Saving…' : 'This is my report · save data'}</button>
            <InstallApp /><p className="text-xs">iPhone: Safari → Share → Add to Home Screen. Android: use Install Reliv. Open the installed app and scan your payment QR there before saving. Some browsers keep installed-app storage separate. Already saved in your browser? Download an encrypted backup from My saved health records and import it in the installed app. Installation requires your approval.</p></>}
        {message && <p role="status" className="break-words">{message}</p>}
    </section>;
}
