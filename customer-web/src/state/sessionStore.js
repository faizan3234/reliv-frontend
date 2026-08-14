import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'reliv_customer_session_v1';

export const INITIAL_STATE = {
  sessionId: '',
  pairingToken: '',
  kioskId: 'RELIV-001',
  serviceType: '', // 'HEALTH_CHECKUP' | 'MEDICINE'
  customerDetails: {
    name: '',
    age: '',
    gender: 'Male',
    email: '',
    phone: ''
  },
  cart: [], // [{ kit_id: string, name: string, price: number, quantity: number }]
  transactionId: '',
  amount: 0,
  currency: 'INR',
  paymentState: 'START', // State machine enum
  error: null,
  isLoaded: false
};

/**
 * Custom React Hook for Managing Customer Session State backed by sessionStorage.
 */
export function useSessionStore() {
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed, isLoaded: true };
      }
    } catch (e) {
      console.warn('Failed to parse sessionStorage:', e);
    }
    return { ...INITIAL_STATE, isLoaded: true };
  });

  // Sync to sessionStorage on state change
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
