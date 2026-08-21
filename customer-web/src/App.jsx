import React from 'react';
import { useSessionStore } from './state/sessionStore';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { StartPage } from './pages/Start/StartPage';
import { CustomerDetailsPage } from './pages/CustomerDetails/CustomerDetailsPage';
import { ServiceSelectionPage } from './pages/ServiceSelection/ServiceSelectionPage';
import { CartPage } from './pages/Cart/CartPage';
import { PaymentPage } from './pages/Payment/PaymentPage';
import { PaymentProcessingPage } from './pages/PaymentProcessing/PaymentProcessingPage';
import { CompletionPage } from './pages/Completion/CompletionPage';
import { ErrorPage } from './pages/Error/ErrorPage';

export function App() {
  const sessionStore = useSessionStore();
  const { state } = sessionStore;

  if (!state.isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white flex items-center justify-center text-slate-500 text-sm">
        Loading session context...
      </div>
    );
  }

  const renderActiveScreen = () => {
    switch (state.paymentState) {
      case 'START':
      case 'CONNECTING':
      case 'SESSION_VALID':
        return <StartPage sessionStore={sessionStore} />;

      case 'DETAILS':
      case 'CUSTOMER_DETAILS':
        return <CustomerDetailsPage sessionStore={sessionStore} />;

      case 'SERVICE':
      case 'SERVICE_SELECTION':
        return <ServiceSelectionPage sessionStore={sessionStore} />;

      case 'CART':
        return <CartPage sessionStore={sessionStore} />;

      case 'PAYMENT':
      case 'PAYMENT_READY':
      case 'PAYMENT_OPEN':
        return <PaymentPage sessionStore={sessionStore} />;

      case 'PAYMENT_PROCESSING':
      case 'PAYMENT_BRIDGE_VERIFYING':
      case 'PAYMENT_HANDOFF':
        return <PaymentProcessingPage sessionStore={sessionStore} />;

      case 'COMPLETED':
      case 'DISPENSING':
      case 'REPORT_GENERATING':
        return <CompletionPage sessionStore={sessionStore} />;

      case 'ERROR':
      case 'PAYMENT_FAILED':
      case 'PAYMENT_VERIFICATION_FAILED':
      default:
        return <ErrorPage sessionStore={sessionStore} />;
    }
  };

  const hasActiveSession = Boolean(state.sessionId);
  const showProgress = hasActiveSession &&
    !['START', 'CONNECTING', 'SESSION_VALID', 'ERROR', 'COMPLETED'].includes(state.paymentState);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-white to-white text-slate-900 selection:bg-orange-500 selection:text-white">
      <Header kioskId={hasActiveSession ? state.kioskId : null} />
      
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        {showProgress && (
          <ProgressBar currentState={state.paymentState} />
        )}

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
