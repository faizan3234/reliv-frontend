import React, { Suspense, lazy, useState } from 'react';
const PaymentScanner = lazy(() => import('./components/PaymentScanner').then(m => ({ default: m.PaymentScanner })));
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
          {scanning ? <Suspense fallback={<p role="status">Loading scanner…</p>}><PaymentScanner onClose={() => setScanning(false)} /></Suspense> : <>
            {renderActiveScreen()}
            <button type="button" onClick={() => setScanning(true)} className="mt-5 min-h-12 w-full rounded-2xl bg-orange-600 px-4 py-3 font-semibold text-white shadow-sm">Scan kiosk payment QR</button>
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
