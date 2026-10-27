// Missing results are not a demo patient. Zero is a real numeric value.
export function comparisonReading(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}
export function comparisonLabel(value, suffix = '') {
  return Number.isFinite(value) ? `${value}${suffix}` : '—';
}
