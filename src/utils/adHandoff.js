const KEY = 'reliv_ad_payment_handoff';
export function safeAdPaymentUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://reliv7.vercel.app' && url.pathname === '/pay' &&
      !url.username && !url.password && /^#p=[A-Za-z0-9_-]+$/.test(url.hash) ? url.href : '';
  } catch { return ''; }
}
export function readAdHandoff() {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY));
    return data?.expiresAt > Date.now() && safeAdPaymentUrl(data.paymentUrl) ? data : null;
  } catch { return null; }
}
export function saveAdHandoff(payment) {
  // Contains only the already-encrypted short-lived URL, never the paid code.
  try { sessionStorage.setItem(KEY, JSON.stringify({ paymentUrl:payment.paymentUrl, expiresAt:payment.expiresAt, amountPaise:payment.amountPaise })); }
  catch { /* The in-memory link still works if browser storage is unavailable. */ }
}
