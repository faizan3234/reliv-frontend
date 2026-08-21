import React from 'react';
import { useSessionStore } from './state/sessionStore';
import { Header } from './components/Header';
import { StartPage } from './pages/Start/StartPage';
import { PaymentV2Page } from './pages/PaymentV2/PaymentV2Page';
import { ErrorPage } from './pages/Error/ErrorPage';
import { extractPaymentPackage } from './services/session';

export function App() {
  const sessionStore = useSessionStore();
  const { state } = sessionStore;

  if (!state.isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white flex items-center justify-center text-slate-500 text-sm">
        Loading payment context...
      </div>
    );
  }

  // Detect Payment V2 URL route /pay or #p=...
  const hasPackage = Boolean(state.encryptedPackage || extractPaymentPackage());
  const isPayRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/pay') ||
    hasPackage ||
    state.paymentState === 'PAYMENT_V2_FLOW'
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
          {renderActiveScreen()}
        </div>
      </main>

      <footer className="py-4 text-center text-slate-400 text-xs border-t border-orange-100/80 bg-white/60">
        Secure payments powered by Razorpay • Reliv Health
      </footer>
    </div>
  );
}

export default App;
