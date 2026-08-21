/**
 * Parses and extracts QR session params from URL or query string.
 * Format: https://CUSTOMER-SITE/kiosk?sessionId=...&pairingToken=...&kioskId=...
 */
export function extractQueryParams(searchStr = window.location.search) {
  const params = new URLSearchParams(searchStr);
  const sessionId = params.get('sessionId') || params.get('session_id') || '';
  const pairingToken = params.get('pairingToken') || params.get('pairing_token') || params.get('token') || '';
  const kioskId = params.get('kioskId') || params.get('kiosk_id') || '';
  const kioskUrl = params.get('kioskUrl') || params.get('kiosk_url') || import.meta.env.VITE_KIOSK_FALLBACK_URL || '';

  // Transaction params returned from Pi redirects
  const transactionId = params.get('transactionId') || params.get('transaction_id') || '';
  const amountStr = params.get('amount') || '';
  const amount = amountStr ? parseFloat(amountStr) : 0;
  const status = params.get('status') || '';
  const step = params.get('step') || '';

  return { sessionId, pairingToken, kioskId, kioskUrl, transactionId, amount, status, step };
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

/**
 * Validates session parameters.
 */
export function validateSessionParams({ sessionId, pairingToken }) {
  if (!sessionId || sessionId.trim().length === 0) {
    return { valid: false, reason: 'MISSING_SESSION_ID' };
  }
  if (!pairingToken || pairingToken.trim().length === 0) {
    return { valid: false, reason: 'MISSING_PAIRING_TOKEN' };
  }
  return { valid: true };
}
