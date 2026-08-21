import { useState, useEffect, useCallback } from 'react';
import { extractPaymentPackage } from '../services/session';

const STORAGE_KEY = 'reliv_customer_session_v2';

export const INITIAL_STATE = {
  encryptedPackage: '',
  requestId: '',
  confirmationCode: '',
  amount: 0,
  currency: 'INR',
  paymentState: 'IDLE', // 'IDLE' | 'PAYMENT_V2_FLOW' | 'ERROR'
  error: null,
  isLoaded: false
};

/**
 * React Hook for Managing Payment V2 Customer Session State backed by sessionStorage & hash (#p=...).
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

    // Check for Payment V2 encrypted package in window.location.hash (#p=...)
    const pkg = extractPaymentPackage();
    if (pkg) {
      initial.encryptedPackage = pkg;
      initial.paymentState = 'PAYMENT_V2_FLOW';
    } else if (!initial.encryptedPackage) {
      initial.paymentState = 'IDLE';
    }

    initial.isLoaded = true;
    return initial;
  });

  // Listen for hash changes (e.g. navigation to /pay#p=...)
  useEffect(() => {
    const handleHashChange = () => {
      const pkg = extractPaymentPackage();
      if (pkg) {
        setState((prev) => ({
          ...prev,
          encryptedPackage: pkg,
          paymentState: 'PAYMENT_V2_FLOW'
        }));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync state changes to sessionStorage
  useEffect(() => {
    if (!state.isLoaded) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        encryptedPackage: state.encryptedPackage,
        requestId: state.requestId,
        confirmationCode: state.confirmationCode,
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
    resetSession
  };
}
