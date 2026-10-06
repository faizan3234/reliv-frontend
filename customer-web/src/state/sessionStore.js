import { useState, useEffect, useCallback } from 'react';
import { extractPaymentPackage, getPaymentRecovery, getPendingVerification, getPaidSession } from '../services/session';

export const INITIAL_STATE = { encryptedPackage: '', requestId: '', confirmationCode: '', amount: 0, currency: 'INR', paymentState: 'IDLE', error: null, isLoaded: false };
export function initialPaymentState() {
  const pkg = extractPaymentPackage();
  const saved = getPaymentRecovery(pkg);
  const paid = !pkg ? getPaidSession() : getPaidSession(pkg);
  // A QR is the session boundary. Never attach a different request/code to it.
  const encryptedPackage = pkg || saved?.encryptedPackage || paid?.encryptedPackage || '';
  return { ...INITIAL_STATE, encryptedPackage, requestId: saved?.requestId || paid?.requestId || '',
    confirmationCode: !pkg && paid?.confirmationCode ? paid.confirmationCode : '',
    amount: saved?.amount || paid?.amount || 0, currency: saved?.currency || paid?.currency || 'INR',
    paymentState: encryptedPackage || getPendingVerification()?.requestId || paid?.confirmationCode ? 'PAYMENT_V2_FLOW' : 'IDLE', isLoaded: true };
}
export function useSessionStore() {
  const [state, setState] = useState(initialPaymentState);
  useEffect(() => {
    const changed = () => setState(initialPaymentState());
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  const updateState = useCallback(patch => setState(prev => ({ ...prev, ...patch })), []);
  // Preserve unsettled payment evidence so scanning again can recover it.
  const resetSession = useCallback(() => setState({ ...INITIAL_STATE, isLoaded: true }), []);
  return { state, updateState, resetSession };
}
export default useSessionStore;
