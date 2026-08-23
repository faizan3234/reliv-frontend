export const PENDING_VERIFICATION_KEY = 'reliv_pending_payment_verification';

/**
 * Safely persists normalized Razorpay callback payload to sessionStorage for recovery.
 */
export function savePendingVerification(data) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  if (!data || !data.orderId || !data.paymentId || !data.signature) return;

  try {
    const payload = {
      requestId: data.requestId || '',
      orderId: String(data.orderId).trim(),
      paymentId: String(data.paymentId).trim(),
      signature: String(data.signature).trim(),
      amount: data.amount,
      serviceType: data.serviceType,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[Session] Failed to persist pending verification:', e);
  }
}

/**
 * Retrieves valid pending payment verification data from sessionStorage if present.
 */
export function getPendingVerification() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  try {
    const raw = window.sessionStorage.getItem(PENDING_VERIFICATION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.orderId === 'string' &&
      parsed.orderId.trim().length > 0 &&
      typeof parsed.paymentId === 'string' &&
      parsed.paymentId.trim().length > 0 &&
      typeof parsed.signature === 'string' &&
      parsed.signature.trim().length > 0
    ) {
      return {
        ...parsed,
        orderId: parsed.orderId.trim(),
        paymentId: parsed.paymentId.trim(),
        signature: parsed.signature.trim(),
      };
    }
  } catch (e) {
    console.warn('[Session] Failed to read pending verification:', e);
  }
  return null;
}

/**
 * Clears pending verification state after successful confirmation code receipt.
 */
export function clearPendingVerification() {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
  } catch (e) {
    console.warn('[Session] Failed to clear pending verification:', e);
  }
}

/**
 * Safely extracts Payment V2 encrypted package from window.location.hash.
 * Format: #p=<ENCRYPTED_PACKAGE>
 * Client-side only; does not send package to server.
 */
export function extractPaymentPackage(hashStr = typeof window !== 'undefined' ? window.location.hash : '') {
  if (!hashStr || typeof hashStr !== 'string') return null;
  const hash = hashStr.startsWith('#') ? hashStr.slice(1) : hashStr;
  if (!hash) return null;

  // Supports #p=... or #/pay#p=...
  const match = hash.match(/(?:^|[&#?])p=([^&]+)/);
  if (match && match[1]) {
    try {
      const decoded = decodeURIComponent(match[1]).trim();
      return decoded.length > 0 ? decoded : null;
    } catch {
      const raw = match[1].trim();
      return raw.length > 0 ? raw : null;
    }
  }
  return null;
}
