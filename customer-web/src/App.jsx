import { MyHealth } from './components/MyHealth';
import { MyRecords } from './components/MyRecords';
import { InstallApp } from './components/InstallApp';
import { setAppIdle, checkForAppUpdate, refreshApp } from './services/pwaRuntime';
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
  const [section, setSection] = useState(() => window.location.pathname === '/scan' ? 'scan' : (state.encryptedPackage || getPendingVerification() || getPaidSession() ? 'payment' : 'health'));
  useEffect(() => { if (state.encryptedPackage) { setSection('payment'); setScanning(false); } }, [state.encryptedPackage]);
  const chooseSection = next => { setSection(next); setScanning(next === 'scan'); if (next === 'scan') { prepareScanSound(); loadScanner().catch(() => {}); } };
  const [scanNotice, setScanNotice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('IDLE');
  const [refreshNotice, setRefreshNotice] = useState('');
  useEffect(() => {
    const status = event => setPaymentStatus(event.detail);
    window.addEventListener('reliv-payment-status', status);
    return () => window.removeEventListener('reliv-payment-status', status);
  }, []);
  useEffect(() => {
    setAppIdle(!scanning && !state.encryptedPackage && !extractPaymentPackage() && !getPendingVerification() && !getPaymentRecovery() && !getPaidSession());
    return () => setAppIdle(false);
  }, [scanning, state, paymentStatus]);
  const refresh = async () => {
    if (scanning || state.encryptedPackage || extractPaymentPackage() || getPendingVerification() || getPaidSession()) {
      await checkForAppUpdate();
      setRefreshNotice('Your active session stays open safely. Updates apply when it finishes.');
      return;
    }
    refreshApp();
  };
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
    setScanning(false); setSection('payment');
  }, []);

  if (!state.isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white flex items-center justify-center text-slate-500 text-sm">
        Loading payment context...
      </div>
    );
  }

  // Detect Payment V2 URL route /pay, #p=..., active pending verification, stored recovery session, or active 5-min paid session
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
    <div className="reliv-app min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-white to-white text-slate-900 selection:bg-orange-500 selection:text-white">
      <Header onRefresh={refresh} />
      
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="pb-8">
          {refreshNotice && <p role="status" className="mb-3 text-sm text-slate-600">{refreshNotice}</p>}
          <nav aria-label="Reliv sections" className="mb-6 grid grid-cols-3 gap-1 rounded-2xl border border-orange-100 bg-white p-1 shadow-sm">
            {[['health','My Health'],['scan','Scan QR'],['records','Health Records']].map(([key,label]) => <button key={key} type="button" aria-current={section === key ? 'page' : undefined} onClick={() => chooseSection(key)} className={`min-h-14 rounded-xl px-2 py-3 text-sm font-semibold ${section === key ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-orange-50'}`}>{label}</button>)}
          </nav>
          {section === 'health' && <><MyHealth onScan={() => chooseSection('scan')} onRecords={() => chooseSection('records')} /><div className="mt-5"><InstallApp /></div></>}
          {section === 'records' && <MyRecords standalone />}
          {scanning && <ScannerPanel onClose={() => chooseSection(hasPackage ? 'payment' : 'health')} onScan={scanned} />}
          {hasPackage && section !== 'payment' && <button type="button" onClick={() => chooseSection('payment')} className="mt-5 min-h-12 w-full rounded-xl border border-orange-300 bg-white px-4 font-semibold text-orange-800">Return to payment / kiosk code</button>}
          {/* Keep active checkout mounted while browsing records; switching sections must not recreate an order. */}
          <div hidden={section !== 'payment'}>
            {scanNotice && <p role="status" className="rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">✓ QR captured. Opening this kiosk payment.</p>}
            {(isPayRoute || hasPackage || section === 'payment') && renderActiveScreen()}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-slate-400 text-xs border-t border-orange-100/80 bg-white/60">
        Secure payments powered by Razorpay • Reliv Health
      </footer>
    </div>
  );
}

export default App;

