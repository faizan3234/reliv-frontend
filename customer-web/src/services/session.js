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
      encryptedPackage: data.encryptedPackage || '',
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
      window.localStorage.setItem(PENDING_VERIFICATION_KEY + ':' + payload.requestId, serialized);
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
export function getPendingVerification(requestId) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = requestId
      ? window.localStorage?.getItem(PENDING_VERIFICATION_KEY + ':' + requestId)
      : (window.localStorage && window.localStorage.getItem(PENDING_VERIFICATION_KEY)) ||
        (window.sessionStorage && window.sessionStorage.getItem(PENDING_VERIFICATION_KEY));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Archive a legacy callback before a different QR can replace the global slot.
    if (parsed?.requestId && parsed?.orderId && parsed?.paymentId && parsed?.signature) {
      window.localStorage?.setItem(PENDING_VERIFICATION_KEY + ':' + parsed.requestId, raw);
    }
    if (
      parsed && (!requestId || parsed.requestId === requestId) &&
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
export function clearPendingVerification(requestId) {
  if (typeof window === 'undefined') return;
  try {
    if (requestId) window.localStorage?.removeItem(PENDING_VERIFICATION_KEY + ':' + requestId);
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const saved = JSON.parse(storage?.getItem(PENDING_VERIFICATION_KEY) || 'null');
      if (!requestId || saved?.requestId === requestId) storage?.removeItem(PENDING_VERIFICATION_KEY);
    }
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
      if (payload.encryptedPackage) window.localStorage.setItem(RECOVERY_STORAGE_KEY + ':' + payload.encryptedPackage, serialized);
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
export function getPaymentRecovery(encryptedPackage) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = encryptedPackage
      ? window.localStorage?.getItem(RECOVERY_STORAGE_KEY + ':' + encryptedPackage)
      : (window.localStorage && window.localStorage.getItem(RECOVERY_STORAGE_KEY)) ||
        (window.sessionStorage && window.sessionStorage.getItem(RECOVERY_STORAGE_KEY));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && (!encryptedPackage || parsed.encryptedPackage === encryptedPackage) && (parsed.encryptedPackage || parsed.requestId || parsed.orderId)) {
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
export function clearPaymentRecovery(encryptedPackage) {
  if (typeof window === 'undefined') return;
  try {
    if (encryptedPackage) window.localStorage?.removeItem(RECOVERY_STORAGE_KEY + ':' + encryptedPackage);
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const saved = JSON.parse(storage?.getItem(RECOVERY_STORAGE_KEY) || 'null');
      if (!encryptedPackage || saved?.encryptedPackage === encryptedPackage) storage?.removeItem(RECOVERY_STORAGE_KEY);
    }
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

export const PAID_SESSION_STORAGE_KEY = 'reliv_paid_session_v2';
export const PAID_SESSION_TTL_MS = 5 * 60 * 1000;
let memoryPaid = null;
function paidStores() {
  if (typeof window === 'undefined') return [];
  return ['localStorage', 'sessionStorage'].flatMap(name => {
    try { return window[name] ? [window[name]] : []; } catch { return []; }
  });
}

// Device-local convenience cache, never proof of payment. Only callers that
// have verified paid:true with the bridge may save a code. No server/public cache.
export function savePaidSession(data) {
  if (typeof window === 'undefined' || !/^\d{4}$/.test(String(data?.confirmationCode || '')) || !data.requestId || !data.encryptedPackage) return;
  const existing = getPaidSession(data.encryptedPackage);
  const same = existing?.requestId === data.requestId;
  const paidAt = same ? existing.paidAt : Date.now();
  const previous = getPaidSession();
  if (previous && !same) clearPaidSession(previous.encryptedPackage);
  const payload = {
    confirmationCode: String(data.confirmationCode), requestId: data.requestId,
    orderId: data.orderId || '', encryptedPackage: data.encryptedPackage,
    amount: data.amount || 0, currency: data.currency || 'INR',
    serviceType: data.serviceType || 'HEALTH_CHECKUP', storySummary: data.storySummary || null,
    paidAt, expiresAt: paidAt + PAID_SESSION_TTL_MS,
  };
  memoryPaid = payload;
  for (const storage of paidStores()) {
    try {
      storage.setItem(PAID_SESSION_STORAGE_KEY, JSON.stringify(payload));
      storage.setItem(PAID_SESSION_STORAGE_KEY + ':' + payload.encryptedPackage, JSON.stringify(payload));
    } catch { /* Memory still keeps the displayed code alive if storage is full. */ }
  }
  return payload;
}

export function getPaidSession(encryptedPackage) {
  if (typeof window === 'undefined') return null;
  let parsed = null;
  for (const storage of paidStores()) {
    try {
      const key = PAID_SESSION_STORAGE_KEY + (encryptedPackage ? ':' + encryptedPackage : '');
      const candidate = JSON.parse(storage.getItem(key) || storage.getItem(PAID_SESSION_STORAGE_KEY) || 'null');
      if (candidate && (!encryptedPackage || candidate.encryptedPackage === encryptedPackage)) { parsed = candidate; break; }
    } catch { /* Try the other local storage, then memory. */ }
  }
  parsed ||= (!encryptedPackage || memoryPaid?.encryptedPackage === encryptedPackage) ? memoryPaid : null;
  if (!parsed || !/^\d{4}$/.test(String(parsed.confirmationCode)) || !parsed.requestId || !parsed.encryptedPackage) return null;
  if (!Number.isFinite(parsed.paidAt) || !Number.isFinite(parsed.expiresAt) ||
      Date.now() >= Math.min(parsed.expiresAt, parsed.paidAt + PAID_SESSION_TTL_MS)) {
    clearPaidSession(parsed.encryptedPackage);
    clearPaymentRecovery(parsed.encryptedPackage);
    if (extractPaymentPackage() === parsed.encryptedPackage) window.history.replaceState(null, '', '/');
    return null;
  }
  return parsed;
}

export function clearPaidSession(encryptedPackage) {
  if (!encryptedPackage || memoryPaid?.encryptedPackage === encryptedPackage) memoryPaid = null;
  for (const storage of paidStores()) {
    try {
      if (encryptedPackage) storage.removeItem(PAID_SESSION_STORAGE_KEY + ':' + encryptedPackage);
      const saved = JSON.parse(storage.getItem(PAID_SESSION_STORAGE_KEY) || 'null');
      if (!encryptedPackage || saved?.encryptedPackage === encryptedPackage) {
        if (saved?.encryptedPackage) storage.removeItem(PAID_SESSION_STORAGE_KEY + ':' + saved.encryptedPackage);
        storage.removeItem(PAID_SESSION_STORAGE_KEY);
      }
    } catch { /* Storage may be unavailable in private browsing. */ }
  }
}
