/**
 * Normalize a payment URL before it is rendered into a QR code.
 *
 * Payment V2 returns an HTTPS gateway URL containing the encrypted package in
 * the fragment.  Keeping the QR value as a URL (instead of serialising an
 * object in the browser) lets URL-capable camera apps open the gateway.
 * Payment-only scanners may reject web URLs; their support is app-dependent.
 */
export const PAYMENT_QR_MEDIUM_BYTES = 2331;
export const PAYMENT_QR_MAX_BYTES = 2953;

export function normalizePaymentQrValue(value, { maxBytes = PAYMENT_QR_MEDIUM_BYTES } = {}) {
  if (typeof value !== "string") return "";

  const raw = value.trim();
  if (!raw) return "";
  if (Array.from(raw).some((character) => {
    const code = character.charCodeAt(0);
    return character.trim() === "" || code < 32 || code === 127;
  })) return "";

  try {
    const url = new URL(raw);

    // A phone scanner must be able to reach the gateway.  Never put a kiosk's
    // private HTTP address or a malformed value into the QR image.
    if (!/^https:\/\//i.test(raw) || url.protocol !== "https:" || url.username || url.password) return "";
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    // Payment is opened over the phone's Internet, not the Pi's private LAN.
    if (!host.includes('.') || host.endsWith('.localhost') || host.endsWith('.local') || host.startsWith('[')) return "";
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const [a, b] = host.split('.').map(Number);
      if (a === 0 || a === 10 || a === 127 || a >= 224 ||
          (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return "";
    }
    const normalized = url.toString();
    // Keep the limit tied to the QR error-correction level. Payment V2 with
    // the backend's standard 4096-bit key legitimately exceeds 2200 bytes.
    if (new TextEncoder().encode(normalized).length > maxBytes) return "";
    return normalized;
  } catch {
    return "";
  }
}

export function getPaymentQrConfig(value) {
  const url = normalizePaymentQrValue(value, { maxBytes: PAYMENT_QR_MAX_BYTES });
  if (!url) return null;
  return {
    value: url,
    level: new TextEncoder().encode(url).length <= PAYMENT_QR_MEDIUM_BYTES ? 'M' : 'L',
  };
}

export function paymentQrError(value) {
  const url = normalizePaymentQrValue(value, { maxBytes: 65536 });
  return url && new TextEncoder().encode(url).length > PAYMENT_QR_MAX_BYTES
    ? 'This payment QR is too large. Ask the kiosk operator to update the payment service, or return to the cart and select fewer items. If you already paid, do not pay again.'
    : 'The kiosk returned an invalid payment address. Ask the kiosk operator to check the payment service configuration.';
}
