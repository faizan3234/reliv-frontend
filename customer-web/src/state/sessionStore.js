import { useState, useEffect, useCallback } from 'react';
import { extractQueryParams } from '../services/session';

const STORAGE_KEY = 'reliv_customer_session_v1';

export const INITIAL_STATE = {
  sessionId: '',
  pairingToken: '',
  kioskId: 'RELIV-001',
  kioskUrl: import.meta.env.VITE_KIOSK_FALLBACK_URL || '',
  serviceType: '', // 'HEALTH_CHECKUP' | 'MEDICINE'
  customerDetails: {
    name: '',
    age: '',
    gender: 'Male',
    email: '',
    phone: ''
  },
  cart: [], // [{ kit_id: string, quantity: number }]
  transactionId: '',
  amount: 0,
  currency: 'INR',
  paymentState: 'START', // State machine enum
  error: null,
  isLoaded: false
};

/**
 * Custom React Hook for Managing Customer Session State backed by sessionStorage & URL params.
 */
export function useSessionStore() {
  const [state, setState] = useState(() => {
    let initial = { ...INITIAL_STATE };
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        initial = { ...initial, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse sessionStorage:', e);
    }

    // Check URL parameters for return redirects from Pi
    const urlParams = extractQueryParams();
    if (urlParams.sessionId) initial.sessionId = urlParams.sessionId;
    if (urlParams.pairingToken) initial.pairingToken = urlParams.pairingToken;
    if (urlParams.kioskId) initial.kioskId = urlParams.kioskId;
    if (urlParams.kioskUrl) initial.kioskUrl = urlParams.kioskUrl;
    if (urlParams.transactionId) initial.transactionId = urlParams.transactionId;
    if (urlParams.amount > 0) initial.amount = urlParams.amount;


    // Direct state transition based on returnUrl step & status parameters
    if (urlParams.step === 'payment' && urlParams.transactionId) {
      initial.paymentState = 'PAYMENT_READY';
    } else if (urlParams.step === 'service') {
      initial.paymentState = 'SERVICE_SELECTION';
    } else if (urlParams.step === 'completion') {
      // STRICT RULE: step=completion alone NEVER means COMPLETED without verified backend status!
      if (['dispense_complete', 'report_queued', 'report_ready'].includes(urlParams.status)) {
        initial.paymentState = 'COMPLETED';
      } else if (urlParams.status === 'dispensing') {
        initial.paymentState = 'DISPENSING';
      } else if (urlParams.status === 'report_generating') {
        initial.paymentState = 'REPORT_GENERATING';
      } else {
        initial.paymentState = 'PAYMENT_HANDOFF';
      }

    }


    initial.isLoaded = true;
    return initial;
  });

  // Sync state changes to sessionStorage
  useEffect(() => {
    if (!state.isLoaded) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId: state.sessionId,
        pairingToken: state.pairingToken,
        kioskId: state.kioskId,
        serviceType: state.serviceType,
        customerDetails: state.customerDetails,
        cart: state.cart,
        transactionId: state.transactionId,
        amount: state.amount,
        currency: state.currency,
        paymentState: state.paymentState
      }));
    } catch (e) {
      console.warn('Failed to save to sessionStorage:', e);
    }
  }, [state]);

  const updateState = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateCustomerDetails = useCallback((detailsPatch) => {
    setState((prev) => ({
      ...prev,
      customerDetails: { ...prev.customerDetails, ...detailsPatch }
    }));
  }, []);

  const updateCart = useCallback((newCart) => {
    setState((prev) => ({ ...prev, cart: newCart }));
  }, []);

  const resetSession = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    setState({ ...INITIAL_STATE, isLoaded: true });
  }, []);

  return {
    state,
    updateState,
    updateCustomerDetails,
    updateCart,
    resetSession
  };
}
