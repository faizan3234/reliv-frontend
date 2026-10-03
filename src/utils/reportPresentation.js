import { getPaymentQrConfig } from './paymentQr';

export function positiveReading(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function reportPaymentQr(data) {
  // Never replace a session-bearing URL with the payment site's homepage.
  const qr = getPaymentQrConfig(data?.reportPaymentUrl);
  if (!qr) return null;
  const payload = new URLSearchParams(new URL(qr.value).hash.slice(1)).get('p');
  return payload ? qr : null;
}

export function ageComparison(data) {
  const actual = positiveReading(data?.patient?.age);
  const estimated = positiveReading(data?.vitals?.metabolicAge);
  return { actual, estimated, difference: actual !== null && estimated !== null ? Math.round((estimated - actual) * 10) / 10 : null };
}
