import React, { useEffect, useRef, useState } from 'react';
import { requestJSON } from '../../../src/utils/request';
import { PAYMENT_API_BASE } from '../services/bridgeApi';
import { readVault, saveRecord } from '../services/reportVault';
import { InstallApp } from './InstallApp';
export function AppReportSave({ encryptedPackage }) {
    const [availability, setAvailability] = useState('checking'), [attempt, setAttempt] = useState(0), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
    const lock = useRef(null);
    const checkedPackage = useRef(null);
    const currentPackage = useRef(encryptedPackage); currentPackage.current = encryptedPackage;
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const transfer = async (automatic = false) => {
        if (lock.current || availability !== 'enabled' || checkedPackage.current !== encryptedPackage) return;
        const controller = new AbortController();
        lock.current = controller; setBusy(true); setMessage('');
        try {
            const result = await requestJSON(`${PAYMENT_API_BASE}/api/v2/app-record`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ package: encryptedPackage }), signal:controller.signal, timeoutMs: 15000, cache: 'no-store' });
            if (controller.signal.aborted || !mounted.current || currentPackage.current !== encryptedPackage) return;
            if (!result.ok) throw Error(result.message || 'Report saving is unavailable.');
            const consent = automatic ? readVault().autoProfiles.includes(result.record.profileKey) : true;
            if (automatic && !consent) return;
            await saveRecord(result.record, consent);
            if (mounted.current && currentPackage.current === encryptedPackage) setMessage(`Scan ${result.record.scanNumber} saved on this phone. Email is separate and optional.`);
        } catch (error) { if (controller.signal.aborted || !mounted.current || currentPackage.current !== encryptedPackage) return; if (error.status === 403) setAvailability('disabled'); setMessage(error.message || 'Could not save. Please retry.'); }
        finally { if (lock.current === controller) { lock.current = null; if (mounted.current) setBusy(false); } }
    };
    const automatic = useRef(transfer); automatic.current = transfer;
    useEffect(() => {
        let active = true; const controller = new AbortController();
        lock.current?.abort(); lock.current=null; checkedPackage.current=null;
        setBusy(false); setAvailability('checking'); setMessage(''); setOpen(false);
        requestJSON(`${PAYMENT_API_BASE}/api/v2/app-features`, { signal: controller.signal, cache: 'no-store', timeoutMs: 10000 }).then(data => {
            if (!active) return;
            if (data.appReportSync === true) {
                checkedPackage.current=encryptedPackage;
                setAvailability('enabled');
                // Transfer after state has rendered; automatic.current then has the enabled guard.
            } else if (data.appReportSync === false) setAvailability('disabled');
            else setAvailability('unavailable');
        }).catch(() => { if (active) setAvailability('unavailable'); });
        return () => { active = false; controller.abort(); lock.current?.abort(); lock.current=null; checkedPackage.current=null; };
    }, [encryptedPackage, attempt]);
    useEffect(() => {
        if (availability !== 'enabled' || checkedPackage.current !== encryptedPackage) return;
        try { if (readVault().autoProfiles.length > 0) void automatic.current(true); }
        catch { setMessage('Saved records could not be read. Existing records have not been replaced.'); }
    }, [availability, encryptedPackage]);
    return <section aria-label="Save health report to app" className="rounded-2xl border border-orange-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900">Keep your health records on this phone</h3>
        <p className="text-sm text-slate-600">Save readings and your actual scan number to Reliv. Add later scans to compare your progress. Emailing the PDF is separate.</p>
        <button type="button" disabled={availability !== 'enabled' || busy} aria-expanded={open && availability === 'enabled'} onClick={() => { setOpen(true); void transfer(false); }} className="min-h-12 w-full rounded-xl bg-orange-700 px-4 py-3 font-bold text-white disabled:bg-slate-200 disabled:text-slate-600">Send my health report to my app</button>
        {availability !== 'enabled' && <p role="status" className="text-sm text-slate-700">{availability === 'checking' ? 'Checking app saving…' : availability === 'disabled' ? 'App saving is currently switched off by Reliv. Your payment code and email report still work.' : 'App saving is temporarily unavailable. Check your phone internet and retry. Your payment is unaffected.'}</p>}
        {['disabled', 'unavailable'].includes(availability) && <button type="button" onClick={() => setAttempt(value => value + 1)} className="min-h-11 text-sm font-semibold underline">Check availability again</button>}
        {open && availability === 'enabled' && <><InstallApp /><p className="text-xs">No password needed. Scans stay on this browser/app and can be read by anyone using this unlocked phone. Clearing app data removes them. Later scans for this profile save when you scan their payment QR here; turn auto-save off in My saved health records.</p></>}
        {message && <p role="status" className="break-words">{message}</p>}
    </section>;
}

