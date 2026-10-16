// Third-party scanner WebViews control whether UPI intents may leave their app.
// Detection is a hint only; offer the escape route on all Android browsers.
export function paymentBrowserInfo(userAgent = '') {
  return {
    android: /Android/i.test(userAgent),
    embedded: /Android/i.test(userAgent) && /;\s*wv\)|\bwv\b|Version\/4\.0|GPay|GooglePay|FBAN|FBAV|Instagram/i.test(userAgent),
  };
}

export function paymentBrowserLinks(encryptedPackage, origin) {
  if (typeof encryptedPackage !== 'string' || !encryptedPackage || encryptedPackage.length > 16384) return null;
  const url = new URL('/pay', origin);
  if (url.protocol !== 'https:') return null;
  // Keep the full original capability in the fragment, never in HTTP query logs.
  url.hash = new URLSearchParams({ p: encryptedPackage }).toString();
  const web = url.href;
  // Android parses the final #Intent marker; the earlier #p remains URL data.
  const chrome = `intent://${web.slice('https://'.length)}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(web)};end`;
  return { web, chrome };
}
