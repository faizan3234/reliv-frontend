import React from 'react';
import { useSessionStore } from '../../customer-web/src/state/sessionStore';
import { PaymentV2Page } from '../../customer-web/src/pages/PaymentV2/PaymentV2Page';
import './PayAd.css';

// Share the real Payment V2 gateway: amounts and activation codes come only
// from verified backend responses, never campaign/code query parameters.
export default function PayAd() {
  const sessionStore = useSessionStore();
  return (
    <main className="payad-container scrollable-container">
      <div className="payad-card">
        <PaymentV2Page sessionStore={sessionStore} />
      </div>
    </main>
  );
}
