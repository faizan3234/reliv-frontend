export const PENDING_VERIFICATION_KEY = 'reliv_pending_payment_verification';
export const RECOVERY_STORAGE_KEY = 'reliv_payment_recovery_v2';

/**
 * Safely persists normalized Razorpay callback payload to localStorage & sessionStorage for recovery.
 * Never stores confirmationCode, secrets, or private keys.
 */
export function savePendingVerification(data) {
  if (typeof window === 'undefined') return;
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
    const serialized = JSON.stringify(payload);
    if (window.localStorage) {
      window.localStorage.setItem(PENDING_VERIFICATION_KEY, serialized);
    }
    if (window.sessionStorage) {
      window.sessionStorage.setItem(PENDING_VERIFICATION_KEY, serialized);
    }
  } catch (e) {
    console.warn('[Session] Failed to persist pending verification:', e);
  }
}

/**
 * Retrieves valid pending payment verification data from localStorage/sessionStorage.
 */
export function getPendingVerification() {
  if (typeof window === 'undefined') return null;

  try {
    const raw =
      (window.localStorage && window.localStorage.getItem(PENDING_VERIFICATION_KEY)) ||
      (window.sessionStorage && window.sessionStorage.getItem(PENDING_VERIFICATION_KEY));
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
 * Clears pending verification state after successful confirmation code reveal.
 */
export function clearPendingVerification() {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage) window.localStorage.removeItem(PENDING_VERIFICATION_KEY);
    if (window.sessionStorage) window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
  } catch (e) {
    console.warn('[Session] Failed to clear pending verification:', e);
  }
}

/**
 * Persists high-level payment recovery session to localStorage.
 * Includes requestId, encryptedPackage, orderId, paymentState, created/expiry time.
 * Explicitly excludes 4-digit code, credentials, or secrets.
 */
export function savePaymentRecovery(data) {
  if (typeof window === 'undefined') return;
  if (!data) return;

  try {
    const payload = {
      requestId: data.requestId || '',
      encryptedPackage: data.encryptedPackage || '',
      orderId: data.orderId || '',
      amount: data.amount || 0,
      currency: data.currency || 'INR',
      serviceType: data.serviceType || 'HEALTH_CHECKUP',
      keyId: data.keyId || '',
      paymentState: data.paymentState || 'INIT',
      createdTime: data.createdTime || Date.now(),
      timestamp: Date.now(),
    };
    const serialized = JSON.stringify(payload);
    if (window.localStorage) {
      window.localStorage.setItem(RECOVERY_STORAGE_KEY, serialized);
    }
    if (window.sessionStorage) {
      window.sessionStorage.setItem(RECOVERY_STORAGE_KEY, serialized);
    }
  } catch (e) {
    console.warn('[Session] Failed to save payment recovery session:', e);
  }
}

/**
 * Retrieves payment recovery session from localStorage/sessionStorage.
 */
export function getPaymentRecovery() {
  if (typeof window === 'undefined') return null;

  try {
    const raw =
      (window.localStorage && window.localStorage.getItem(RECOVERY_STORAGE_KEY)) ||
      (window.sessionStorage && window.sessionStorage.getItem(RECOVERY_STORAGE_KEY));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && (parsed.encryptedPackage || parsed.requestId || parsed.orderId)) {
      return parsed;
    }
  } catch (e) {
    console.warn('[Session] Failed to read payment recovery session:', e);
  }
  return null;
}

/**
 * Clears persistent payment recovery session from localStorage/sessionStorage.
 */
export function clearPaymentRecovery() {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage) window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
    if (window.sessionStorage) window.sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch (e) {
    console.warn('[Session] Failed to clear payment recovery session:', e);
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
