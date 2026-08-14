/**
 * Parses and extracts QR session params from URL or query string.
 * Format: https://CUSTOMER-SITE/kiosk?sessionId=...&pairingToken=...&kioskId=...
 */
export function extractQueryParams(searchStr = window.location.search) {
  const params = new URLSearchParams(searchStr);
  const sessionId = params.get('sessionId') || params.get('session_id') || '';
  const pairingToken = params.get('pairingToken') || params.get('pairing_token') || params.get('token') || '';
  const kioskId = params.get('kioskId') || params.get('kiosk_id') || import.meta.env.VITE_DEFAULT_KIOSK_ID || 'RELIV-001';
  const kioskUrl = params.get('kioskUrl') || params.get('kiosk_url') || import.meta.env.VITE_KIOSK_FALLBACK_URL || 'http://192.168.50.1';

  // Transaction params returned from Pi redirects
  const transactionId = params.get('transactionId') || params.get('transaction_id') || '';
  const amountStr = params.get('amount') || '';
  const amount = amountStr ? parseFloat(amountStr) : 0;
  const status = params.get('status') || '';
  const step = params.get('step') || '';

  return { sessionId, pairingToken, kioskId, kioskUrl, transactionId, amount, status, step };
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
