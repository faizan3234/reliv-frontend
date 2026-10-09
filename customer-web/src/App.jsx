import { prepareScanSound } from './services/scanFeedback';
import React, { useState, useEffect, useCallback } from 'react';
let scannerModule;
const loadScanner = () => {
  if (!scannerModule) scannerModule = import('./components/PaymentScanner').then(m => ({ default: m.PaymentScanner })).catch(error => { scannerModule = null; throw error; });
  return scannerModule;
};
function ScannerPanel({onScan,onClose}) {
  const [Scanner,setScanner] = useState(null);
  const [error,setError] = useState(false);
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    loadScanner().then(module => { if (active) setScanner(() => module.default); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  if (Scanner) return <Scanner onScan={onScan} onClose={onClose}/>;
  return <section className="space-y-3">
    <p role={error ? 'alert' : 'status'}>{error ? 'Scanner could not load. Check your connection and retry.' : 'Loading scanner…'}</p>
    {error && <button type="button" className="min-h-12 rounded-xl bg-orange-600 px-4 text-white" onClick={() => setAttempt(value => value+1)}>Retry scanner</button>}
    <button type="button" className="min-h-12 rounded-xl border px-4" onClick={onClose}>Close</button>
  </section>;
}
import { useSessionStore } from './state/sessionStore';
import { Header } from './components/Header';
import { StartPage } from './pages/Start/StartPage';
import { PaymentV2Page } from './pages/PaymentV2/PaymentV2Page';
import { ErrorPage } from './pages/Error/ErrorPage';
import { extractPaymentPackage, getPendingVerification, getPaymentRecovery, getPaidSession } from './services/session';

export function App() {
  const [scanning, setScanning] = useState(window.location.pathname === '/scan');
  const sessionStore = useSessionStore();
  const { state } = sessionStore;
  const [scanNotice, setScanNotice] = useState(false);
  // Warm only code, not the camera. A user action still opens the scanner.
  useEffect(() => {
    const timer = setTimeout(() => { loadScanner().catch(() => {}); }, 400);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!scanNotice) return;
    const timer = setTimeout(() => setScanNotice(false), 3000);
    return () => clearTimeout(timer);
  }, [scanNotice]);
  const scanned = useCallback(path => {
    // Keep the PWA document alive (and vibration running). Both payment stores
    // already listen for hashchange and resolve this package before recovery.
    window.history.pushState(null, '', path);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    setScanNotice(true);
    setScanning(false);
  }, []);

  if (!state.isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white flex items-center justify-center text-slate-500 text-sm">
        Loading payment context...
      </div>
    );
  }

  // Detect Payment V2 URL route /pay, #p=..., active pending verification, stored recovery session, or active 3-min paid session
  const pendingVerification = getPendingVerification();
  const paymentRecovery = getPaymentRecovery();
  const paidSession = getPaidSession();
  const hasPackage = Boolean(
    state.encryptedPackage ||
    extractPaymentPackage() ||
    pendingVerification ||
    paymentRecovery?.encryptedPackage ||
    paidSession?.confirmationCode
  );
  const isPayRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/pay') ||
    hasPackage ||
    state.paymentState === 'PAYMENT_V2_FLOW' ||
    Boolean(pendingVerification) ||
    Boolean(paymentRecovery) ||
    Boolean(paidSession)
  );

  const renderActiveScreen = () => {
    if (state.paymentState === 'ERROR' && state.error) {
      return <ErrorPage sessionStore={sessionStore} />;
    }

    if (isPayRoute || hasPackage) {
      return <PaymentV2Page sessionStore={sessionStore} />;
    }

    return <StartPage sessionStore={sessionStore} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-white to-white text-slate-900 selection:bg-orange-500 selection:text-white">
      <Header />
      
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="pb-8">
          {scanning ? <ScannerPanel onClose={() => setScanning(false)} onScan={scanned} /> : <>
            {scanNotice && <p role="status" className="rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">✓ QR captured. Opening this kiosk payment.</p>}
            {renderActiveScreen()}
            <button type="button" onFocus={() => { loadScanner().catch(() => {}); }} onPointerEnter={() => { loadScanner().catch(() => {}); }} onPointerDown={() => { loadScanner().catch(() => {}); }} onClick={() => { prepareScanSound(); setScanning(true); }} className="mt-5 min-h-12 w-full rounded-2xl bg-orange-600 px-4 py-3 font-semibold text-white shadow-sm">Scan kiosk payment QR</button>
          </>}
        </div>
      </main>

      <footer className="py-4 text-center text-slate-400 text-xs border-t border-orange-100/80 bg-white/60">
        Secure payments powered by Razorpay • Reliv Health
      </footer>
    </div>
  );
}

export default App;
