import { useState, useEffect, useCallback } from 'react';
import { extractPaymentPackage, getPaymentRecovery, getPendingVerification, getPaidSession } from '../services/session';

export const INITIAL_STATE = { encryptedPackage: '', requestId: '', confirmationCode: '', amount: 0, currency: 'INR', paymentState: 'IDLE', error: null, isLoaded: false };
export function initialPaymentState() {
  getPaidSession(); // Prune expired code and its URL before restoring a route.
  const pkg = extractPaymentPackage();
  const saved = getPaymentRecovery(pkg);
  const paid = pkg ? getPaidSession(pkg) : getPaidSession();
  // Without a new QR, resume the most recent confirmed code before an older
  // unfinished recovery slot. Never mix identity fields from different slots.
  const source = paid || saved;
  const encryptedPackage = pkg || source?.encryptedPackage || '';
  return { ...INITIAL_STATE, encryptedPackage, requestId: source?.requestId || '',
    confirmationCode: paid?.confirmationCode || '',
    amount: source?.amount || 0, currency: source?.currency || 'INR',
    paymentState: encryptedPackage || getPendingVerification()?.requestId ? 'PAYMENT_V2_FLOW' : 'IDLE', isLoaded: true };
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
