import { useState, useEffect, useCallback } from 'react';
import {
  extractPaymentPackage,
  getPendingVerification,
  clearPendingVerification,
  getPaymentRecovery,
  savePaymentRecovery,
  clearPaymentRecovery,
} from '../services/session';

export const INITIAL_STATE = {
  encryptedPackage: '',
  requestId: '',
  confirmationCode: '', // kept in-memory only; never stored permanently
  amount: 0,
  currency: 'INR',
  paymentState: 'IDLE', // 'IDLE' | 'PAYMENT_V2_FLOW' | 'ERROR'
  error: null,
  isLoaded: false
};

/**
 * React Hook for Managing Payment V2 Customer Session State backed by persistent localStorage & URL hash (#p=...).
 */
export function useSessionStore() {
  const [state, setState] = useState(() => {
    let initial = { ...INITIAL_STATE };

    // Check persistent recovery storage first
    const recovery = getPaymentRecovery();
    if (recovery) {
      initial = {
        ...initial,
        encryptedPackage: recovery.encryptedPackage || '',
        requestId: recovery.requestId || '',
        amount: recovery.amount || 0,
        currency: recovery.currency || 'INR',
        paymentState: recovery.paymentState || 'PAYMENT_V2_FLOW',
      };
    }

    // Check for Payment V2 encrypted package in window.location.hash (#p=...) or active pending verification
    const pkg = extractPaymentPackage();
    const pending = getPendingVerification();
    if (pkg || pending) {
      if (pkg) initial.encryptedPackage = pkg;
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

  // Sync state changes to recovery storage (without storing confirmationCode)
  useEffect(() => {
    if (!state.isLoaded) return;
    if (state.encryptedPackage || state.requestId) {
      savePaymentRecovery({
        encryptedPackage: state.encryptedPackage,
        requestId: state.requestId,
        amount: state.amount,
        currency: state.currency,
        paymentState: state.paymentState
      });
    }
  }, [state]);

  const updateState = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSession = useCallback(() => {
    clearPaymentRecovery();
    clearPendingVerification();
    setState({ ...INITIAL_STATE, isLoaded: true });
  }, []);

  return {
    state,
    updateState,
    resetSession
  };
}

export default useSessionStore;
