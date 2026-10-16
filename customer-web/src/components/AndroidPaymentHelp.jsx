import React, { useState } from 'react';
import { paymentBrowserInfo, paymentBrowserLinks } from '../services/paymentBrowser';

export function AndroidPaymentHelp({ encryptedPackage, busy = false }) {
  const [showLink, setShowLink] = useState(false), [message, setMessage] = useState('');
  const browser = paymentBrowserInfo(navigator.userAgent);
  const links = paymentBrowserLinks(encryptedPackage, window.location.origin);
  if (!browser.android || !links) return null;
  const copy = async () => {
    setShowLink(true);
    try { await navigator.clipboard.writeText(links.web); setMessage('Link copied. Paste it into Chrome to continue this same payment.'); }
    catch { setMessage('Press and hold the link below to copy it, then paste it into Chrome.'); }
  };
  return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3" aria-label="Android payment help">
    <h3 className="font-semibold text-slate-900">{browser.embedded ? 'Open in Chrome for UPI payment' : 'Google Pay or your UPI app not opening?'}</h3>
    <p className="text-sm text-slate-700">Some QR scanners open a limited browser. Continue this same payment in Chrome—no second scan needed.</p>
    {!busy ? <a href={links.chrome} onClick={() => setShowLink(true)} className="block min-h-12 rounded-xl bg-orange-700 px-4 py-3 text-center font-semibold text-white">Continue in Chrome</a> : <p className="text-sm">Finish or close the payment window before switching browsers.</p>}
    {!busy && <button type="button" onClick={copy} className="min-h-11 underline text-sm font-semibold">Copy this payment link</button>}
    {showLink && <><p className="text-xs">If Chrome did not open, use the scanner’s ⋮ menu → Open in browser, or paste this link in Chrome. If money was deducted, let Reliv check the payment first; do not pay again.</p><input aria-label="Same payment link" readOnly value={links.web} onFocus={e => e.target.select()} style={{ userSelect: 'text', WebkitUserSelect: 'text' }} className="w-full min-w-0 rounded-lg border bg-white p-2 text-xs" /></>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
