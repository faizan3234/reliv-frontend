import React, { useEffect, useState, useRef } from 'react';
import { Download } from 'lucide-react';

export function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true);
  const [help, setHelp] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const android = /Android/i.test(navigator.userAgent);
  useEffect(() => {
    const offer = event => { event.preventDefault(); setPrompt(event); };
    const done = () => { setInstalled(true); setPrompt(null); setHelp(''); };
    window.addEventListener('beforeinstallprompt', offer);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('beforeinstallprompt', offer);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  if (!android || installed) return null;
  const install = async () => {
    if (locked.current) return;
    if (!prompt) {
      setHelp('In Chrome, open the ⋮ menu and choose “Install app” or “Add to Home screen”. If you opened this inside another app, open it in Chrome first.');
      return;
    }
    locked.current = true; setBusy(true); setHelp('');
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === 'accepted') setInstalled(true);
      else setHelp('You can install Reliv later from your browser menu.');
    } catch { setHelp('Open the Chrome ⋮ menu, then choose “Install app”.'); }
    finally { setPrompt(null); locked.current = false; setBusy(false); }
  };
  return <aside className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
    <div className="flex items-center gap-3">
      <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl bg-white" />
      <div className="min-w-0 flex-1"><p className="font-semibold">Reliv on your home screen</p><p className="text-xs text-slate-600">Open your scanner and recent kiosk code easily.</p></div>
    </div>
    <button type="button" disabled={busy} onClick={install} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"><Download size={18}/>{busy ? 'Opening install…' : 'Install Reliv'}</button>
    {help && <p role="status" className="mt-3 text-sm text-slate-700">{help}</p>}
  </aside>;
}
