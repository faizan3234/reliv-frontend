// Recognition is feedback only: demo JSON must never enter payment checkout.
export function isDemoPaymentQr(value) {
  if (typeof value !== 'string' || value.length > 24000) return false;
  try {
    const sample = JSON.parse(value);
    return sample?.type === 'RELIV_DEMO_SAMPLE' && sample?.status === 'NOT_PAYABLE';
  } catch { return false; }
}

// Never navigate to a scanned host. Transfer only a recognized payment package
// to our own checkout; the bridge still verifies its signature and expiry.
export function paymentPathFromQr(value, origin) {
  if (typeof value === 'string') value = value.trim();
  if (typeof value !== 'string' || value.length > 24000 || /[\s\\]/.test(value)) throw new Error('Scan the payment QR shown on a Reliv kiosk.');
  let url;
  try { url = new URL(value); } catch { throw new Error('This is not a Reliv payment link.'); }
  const own = new URL(origin);
  const trusted = url.origin === own.origin || url.origin === 'https://reliv7.vercel.app';
  if (!trusted || (url.protocol !== 'https:' && !(url.origin === own.origin && own.hostname === 'localhost')) || url.username || url.password || !['/pay', '/pay/'].includes(url.pathname) || url.search) {
    throw new Error('This QR is not a supported Reliv payment link.');
  }
  const params = new URLSearchParams(url.hash.slice(1));
  const pkg = params.get('p');
  if (params.getAll('p').length !== 1 || !pkg || pkg.length > 16384 || !/^[A-Za-z0-9_=-]+$/.test(pkg)) throw new Error('The payment QR is incomplete. Scan it again.');
  return `/pay#p=${encodeURIComponent(pkg)}`;
}
