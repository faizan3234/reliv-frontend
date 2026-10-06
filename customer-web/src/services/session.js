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
export const PAID_SESSION_TTL_MS = 3 * 60 * 1000; // 3 minutes = 180,000 ms

/**
 * Persists the paid session and confirmation code locally on this device.
 * Hard deadline: exactly 3 minutes from payment completion.
 * Reopening the PWA reads this session without resetting or extending the timer.
 */
export function savePaidSession(data) {
  if (typeof window === 'undefined') return;
  if (!data || !data.confirmationCode) return;
  const serviceType = data.serviceType || 'HEALTH_CHECKUP';
  if (['AD_CAMPAIGN', 'RELIV_AD_CAMPAIGN'].includes(serviceType)) {
    // Ad campaign activation codes are one-time kiosk secrets and not persisted in browser simulation
    return;
  }

  try {
    const now = Date.now();
    const paidAt = data.paidAt || now;
    const expiresAt = data.expiresAt || (paidAt + PAID_SESSION_TTL_MS);
    const payload = {
      confirmationCode: String(data.confirmationCode).trim(),
      requestId: data.requestId || '',
      orderId: data.orderId || '',
      encryptedPackage: data.encryptedPackage || '',
      amount: data.amount || 0,
      currency: data.currency || 'INR',
      serviceType: data.serviceType || 'HEALTH_CHECKUP',
      storySummary: data.storySummary || null,
      paidAt,
      expiresAt,
    };
    const serialized = JSON.stringify(payload);
    if (window.localStorage) {
      window.localStorage.setItem(PAID_SESSION_STORAGE_KEY, serialized);
      if (payload.encryptedPackage) {
        window.localStorage.setItem(PAID_SESSION_STORAGE_KEY + ':' + payload.encryptedPackage, serialized);
      }
    }
    if (window.sessionStorage) {
      window.sessionStorage.setItem(PAID_SESSION_STORAGE_KEY, serialized);
    }
  } catch (e) {
    console.warn('[Session] Failed to save paid session:', e);
  }
}

/**
 * Retrieves valid unexpired paid session on this device.
 * Returns null if 3 minutes have passed or if session is missing.
 */
export function getPaidSession(encryptedPackage) {
  if (typeof window === 'undefined') return null;

  try {
    let raw = null;
    if (encryptedPackage) {
      raw = window.localStorage?.getItem(PAID_SESSION_STORAGE_KEY + ':' + encryptedPackage);
      if (!raw) {
        const generic = window.localStorage?.getItem(PAID_SESSION_STORAGE_KEY);
        if (generic) {
          const parsedGeneric = JSON.parse(generic);
          if (parsedGeneric?.encryptedPackage === encryptedPackage) {
            raw = generic;
          }
        }
      }
    } else {
      raw = (window.localStorage && window.localStorage.getItem(PAID_SESSION_STORAGE_KEY)) ||
            (window.sessionStorage && window.sessionStorage.getItem(PAID_SESSION_STORAGE_KEY));
    }
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.confirmationCode) return null;

    // Strict 3-minute expiry check: does NOT reset timer on reopen
    const now = Date.now();
    if (parsed.expiresAt && now > parsed.expiresAt) {
      clearPaidSession(encryptedPackage || parsed.encryptedPackage);
      return null;
    }

    // A specific QR hash must never show another package's code
    if (encryptedPackage && parsed.encryptedPackage && parsed.encryptedPackage !== encryptedPackage) {
      return null;
    }

    if (['AD_CAMPAIGN', 'RELIV_AD_CAMPAIGN'].includes(parsed.serviceType)) {
      return null;
    }

    return parsed;
  } catch (e) {
    console.warn('[Session] Failed to read paid session:', e);
  }
  return null;
}

/**
 * Clears paid session from local storage (e.g. when Done is tapped or after 3 minutes).
 */
export function clearPaidSession(encryptedPackage) {
  if (typeof window === 'undefined') return;
  try {
    if (encryptedPackage) {
      window.localStorage?.removeItem(PAID_SESSION_STORAGE_KEY + ':' + encryptedPackage);
    }
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const saved = JSON.parse(storage?.getItem(PAID_SESSION_STORAGE_KEY) || 'null');
      if (!encryptedPackage || saved?.encryptedPackage === encryptedPackage) {
        storage?.removeItem(PAID_SESSION_STORAGE_KEY);
      }
    }
  } catch (e) {
    console.warn('[Session] Failed to clear paid session:', e);
  }
}

