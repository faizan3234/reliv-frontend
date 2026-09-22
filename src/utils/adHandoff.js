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

export function isIosCaptiveBrowser({
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  platform = typeof navigator !== 'undefined' ? navigator.platform : '',
  maxTouchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0
} = {}) {
  const ua = String(userAgent || '');
  if (/CaptiveNetworkSupport/i.test(ua)) return true;
  const appleMobile = /iPhone|iPad|iPod/i.test(ua) ||
    (platform === 'MacIntel' && Number(maxTouchPoints) > 1);
  if (!appleMobile || !/AppleWebKit/i.test(ua) || !/Mobile/i.test(ua)) return false;
  if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return false;
  return !/Safari\//i.test(ua);
}

export async function copyAdPaymentUrl(value) {
  const paymentUrl = safeAdPaymentUrl(value);
  if (!paymentUrl) return false;

  if (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      return true;
    } catch {
      // Local kiosk pages are usually plain HTTP. Fall through to the
      // user-gesture copy path, which works without Clipboard API access.
    }
  }

  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = paymentUrl;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange?.(0, textarea.value.length);
  let copied = false;
  try {
    copied = document.execCommand?.('copy') === true;
  } catch {
    copied = false;
  } finally {
    textarea.remove();
  }
  return copied;
}
